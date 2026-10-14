import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';

import { Role } from '../../common/enums/role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { UsersService } from '../users/users.service.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { RegistrationFormsService } from '../registration-forms/registration-forms.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { DynamicRegisterDto } from './dto/dynamic-register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { MailService } from '../../common/services/mail.service.js';

const ALLOWED_PUBLIC_ROLES = [Role.STUDENT, Role.INTERVIEWER, Role.TEACHER];

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly registrationFormsService: RegistrationFormsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private getSaltRounds(): number {
    return (
      Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS')) || 10
    );
  }

  private getOtpExpirationDate(): Date {
    const minutes =
      Number(this.configService.get<number>('OTP_EXPIRES_IN_MINUTES')) || 10;
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private getJwtSecret(name: string): string {
    const secret =
      this.configService.get<string>(name) || process.env[name];

    if (!secret) {
      if (process.env.NODE_ENV === 'test') {
        return 'test_jwt_secret_key_12345';
      }
      throw new InternalServerErrorException(`${name} is not configured`);
    }

    return secret;
  }

  /**
   * Public registration using dynamic form schema managed by admin
   */
  async dynamicRegister(dto: DynamicRegisterDto) {
    const targetRole = dto.targetRole;

    if (!ALLOWED_PUBLIC_ROLES.includes(targetRole)) {
      throw new ForbiddenException(
        `Registration is not permitted for privileged role: ${targetRole}`,
      );
    }

    // Validate submission against currently published form
    const { form, credentials, profileData, customFields } =
      await this.registrationFormsService.validateSubmission(
        targetRole,
        dto.formData,
      );

    const email = credentials.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email address is already registered');
    }

    const hashedPassword = await bcrypt.hash(credentials.password, this.getSaltRounds());
    const otp = this.generateOtp();
    const otpExpiresAt = this.getOtpExpirationDate();

    const initialStatus =
      targetRole === Role.STUDENT
        ? UserStatus.ACTIVE
        : UserStatus.PENDING_APPROVAL;

    const user = await this.usersService.create({
      name: credentials.name.trim(),
      email,
      password: hashedPassword,
      roles: [targetRole],
      status: initialStatus,
      isEmailVerified: false,
      otp,
      otpExpiresAt,
      customFields,
      registrationFormId: form._id as any,
    });

    // Create corresponding profile
    await this.profilesService.createProfileForRegistration(
      user._id,
      targetRole,
      profileData,
    );

    // Send verification OTP email for student registration
    if (targetRole === Role.STUDENT) {
      await this.mailService.sendVerificationOtp(email, credentials.name, otp);
    }

    return {
      message:
        targetRole === Role.STUDENT
          ? 'Registration successful. An email verification OTP has been sent to your email.'
          : 'Registration submitted successfully. Your account is pending administrator approval.',
      user: this.usersService.sanitizeUser(user),
      formVersion: form.version,
    };
  }

  /**
   * Direct registration (fallback for allowed roles)
   */
  async register(dto: RegisterDto) {
    const targetRole = (dto.role ?? Role.STUDENT) as Role;

    if (!ALLOWED_PUBLIC_ROLES.includes(targetRole)) {
      throw new ForbiddenException(
        'Public registration is not permitted for privileged roles',
      );
    }

    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email address is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.getSaltRounds());
    const otp = this.generateOtp();
    const otpExpiresAt = this.getOtpExpirationDate();

    const initialStatus =
      targetRole === Role.STUDENT
        ? UserStatus.ACTIVE
        : UserStatus.PENDING_APPROVAL;

    const user = await this.usersService.create({
      name: dto.name.trim(),
      email,
      password: hashedPassword,
      roles: [targetRole],
      status: initialStatus,
      isEmailVerified: false,
      otp,
      otpExpiresAt,
      customFields: {},
    });

    // Create default profile
    await this.profilesService.createProfileForRegistration(
      user._id,
      targetRole,
      {},
    );

    if (targetRole === Role.STUDENT) {
      await this.mailService.sendVerificationOtp(email, dto.name, otp);
    }

    return {
      message:
        targetRole === Role.STUDENT
          ? 'Registration successful. OTP sent for email verification.'
          : 'Registration successful. Account is pending administrator approval.',
      user: this.usersService.sanitizeUser(user),
    };
  }

  /**
   * Authenticate email and password
   */
  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support.',
      );
    }

    if (user.status === UserStatus.PENDING_APPROVAL) {
      throw new ForbiddenException(
        'Your account is pending administrator approval.',
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException(
        'Your account is inactive. Please contact support.',
      );
    }

    const tokens = await this.generateTokens(user);
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      this.getSaltRounds(),
    );

    await this.usersService.updateById(user._id.toString(), {
      refreshToken: hashedRefreshToken,
    });

    return {
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.usersService.sanitizeUser(user),
    };
  }

  private async generateTokens(user: any) {
    const roles = user.roles ?? (user.role ? [user.role] : []);
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      roles,
    };

    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.getJwtSecret('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.getJwtSecret('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: { sub?: string; email?: string; roles?: string[] };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getJwtSecret('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh token revoked or invalid');
    }

    if (
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.INACTIVE
    ) {
      throw new ForbiddenException('User account is suspended or inactive');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token rotation
    const tokens = await this.generateTokens(user);
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      this.getSaltRounds(),
    );

    await this.usersService.updateById(user._id.toString(), {
      refreshToken: hashedRefreshToken,
    });

    return tokens;
  }

  async logout(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.updateById(userId, {
      refreshToken: null,
    });

    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      this.getSaltRounds(),
    );

    // Update password and revoke all existing refresh tokens
    await this.usersService.updateById(userId, {
      password: hashedPassword,
      refreshToken: null,
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(email);

    // Prevent account enumeration by always returning the same response
    if (user && user.status === UserStatus.ACTIVE) {
      const otp = this.generateOtp();
      const otpExpiresAt = this.getOtpExpirationDate();

      await this.usersService.updateById(user._id.toString(), {
        otp,
        otpExpiresAt,
      });
      await this.mailService.sendPasswordResetOtp(user.email, user.name, otp);
    }

    return {
      message:
        'If an account exists with this email address, a password reset code has been sent.',
    };
  }

  async verifyForgotOtp(dto: VerifyOtpDto) {
    await this.verifyOtp(dto.email, dto.otp);
    return {
      message: 'OTP verified successfully. You may now reset your password.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.verifyOtp(dto.email, dto.otp);
    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      this.getSaltRounds(),
    );

    await this.usersService.updateById(user._id.toString(), {
      password: hashedPassword,
      otp: null,
      otpExpiresAt: null,
      refreshToken: null,
    });

    return {
      message: 'Password reset successfully. You can now log in.',
    };
  }

  async verifyEmailOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found or invalid email');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    await this.verifyOtp(email, dto.otp);

    await this.usersService.updateById(user._id.toString(), {
      isEmailVerified: true,
      otp: null,
      otpExpiresAt: null,
    });

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const otp = this.generateOtp();
    const otpExpiresAt = this.getOtpExpirationDate();

    await this.usersService.updateById(user._id.toString(), {
      otp,
      otpExpiresAt,
    });

    await this.mailService.sendVerificationOtp(user.email, user.name, otp);

    return { message: 'New OTP sent to email' };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findSafeById(userId);
    const profiles = await this.profilesService.getProfilesForUser(userId);

    return {
      user,
      profiles,
    };
  }

  private async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || !user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      throw new BadRequestException('OTP code has expired');
    }

    return user;
  }
}
