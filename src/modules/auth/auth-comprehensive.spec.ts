import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { Role } from '../../common/enums/role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';

describe('AuthModule Comprehensive Requirements', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockProfilesService: any;
  let mockRegistrationFormsService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      updateById: vi.fn(),
      sanitizeUser: vi.fn((u) => ({
        id: u._id?.toString() ?? '1',
        name: u.name,
        email: u.email,
        roles: u.roles,
        status: u.status,
      })),
    };

    mockProfilesService = {
      createProfileForRegistration: vi.fn(),
      getProfilesForUser: vi.fn(),
    };

    mockRegistrationFormsService = {
      validateSubmission: vi.fn(),
    };

    mockJwtService = {
      signAsync: vi.fn().mockImplementation((payload, opts) => {
        return Promise.resolve(`jwt_token_${opts.expiresIn}`);
      }),
      verifyAsync: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        return null;
      }),
    };

    authService = new AuthService(
      mockUsersService,
      mockProfilesService,
      mockRegistrationFormsService,
      mockJwtService,
      mockConfigService,
    );
  });

  describe('Registration Flows', () => {
    it('should reject registration for privileged role (e.g. SUPER_ADMIN or ADMIN)', async () => {
      await expect(
        authService.dynamicRegister({
          targetRole: Role.ADMIN as any,
          formData: {},
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject registration if email is already registered', async () => {
      mockRegistrationFormsService.validateSubmission.mockResolvedValue({
        form: { _id: 'form123', version: 1 },
        credentials: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        },
        profileData: {},
        customFields: {},
      });

      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'existing123',
        email: 'jane@example.com',
      });

      await expect(
        authService.dynamicRegister({
          targetRole: Role.STUDENT,
          formData: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'Password123!',
          },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register student with active status and hashed password', async () => {
      mockRegistrationFormsService.validateSubmission.mockResolvedValue({
        form: { _id: 'form123', version: 1 },
        credentials: {
          name: 'Alice Student',
          email: 'alice@example.com',
          password: 'Password123!',
        },
        profileData: { collegeOrUniversity: 'Harvard' },
        customFields: {},
      });

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockImplementation((data: any) => ({
        _id: 'user_new_1',
        ...data,
      }));

      const result = await authService.dynamicRegister({
        targetRole: Role.STUDENT,
        formData: {
          name: 'Alice Student',
          email: 'alice@example.com',
          password: 'Password123!',
          collegeOrUniversity: 'Harvard',
        },
      });

      expect(result.user!.email).toBe('alice@example.com');
      expect(result.user!.status).toBe(UserStatus.ACTIVE);
      expect(mockUsersService.create).toHaveBeenCalled();
      const createCall = mockUsersService.create.mock.calls[0][0];
      // Password must be hashed with bcrypt
      expect(createCall.password).not.toBe('Password123!');
      expect(createCall.password.startsWith('$2')).toBe(true);
      expect(mockProfilesService.createProfileForRegistration).toHaveBeenCalledWith(
        'user_new_1',
        Role.STUDENT,
        { collegeOrUniversity: 'Harvard' },
      );
    });

    it('should set status to PENDING_APPROVAL for interviewer or teacher registrations', async () => {
      mockRegistrationFormsService.validateSubmission.mockResolvedValue({
        form: { _id: 'form123', version: 1 },
        credentials: {
          name: 'Bob Interviewer',
          email: 'bob@techcorp.com',
          password: 'Password123!',
        },
        profileData: { company: 'TechCorp' },
        customFields: {},
      });

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockImplementation((data: any) => ({
        _id: 'user_interviewer_1',
        ...data,
      }));

      const result = await authService.dynamicRegister({
        targetRole: Role.INTERVIEWER,
        formData: {
          name: 'Bob Interviewer',
          email: 'bob@techcorp.com',
          password: 'Password123!',
        },
      });

      const createCall = mockUsersService.create.mock.calls[0][0];
      expect(createCall.status).toBe(UserStatus.PENDING_APPROVAL);
      expect(result.message).toContain('pending administrator approval');
    });
  });

  describe('Login & Status Policies', () => {
    it('should throw 401 Unauthorized on non-existent email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'SomePassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw 401 Unauthorized on invalid password without leaking user existence', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user123',
        email: 'user@example.com',
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      });

      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw 403 Forbidden if account is suspended', async () => {
      const hashedPassword = await bcrypt.hash('MyPassword!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user123',
        email: 'user@example.com',
        password: hashedPassword,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'MyPassword!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw 403 Forbidden if account is pending approval', async () => {
      const hashedPassword = await bcrypt.hash('MyPassword!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user123',
        email: 'user@example.com',
        password: hashedPassword,
        status: UserStatus.PENDING_APPROVAL,
      });

      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'MyPassword!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should issue tokens, hash refreshToken in DB, and never return hashes on successful login', async () => {
      const password = 'ValidPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user123',
        name: 'Active Student',
        email: 'student@example.com',
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        roles: [Role.STUDENT],
      });

      const response = await authService.login({
        email: 'student@example.com',
        password,
      });

      expect(response.accessToken).toBeDefined();
      expect(response.refreshToken).toBeDefined();
      expect(response.user!.email).toBe('student@example.com');
      expect((response as any).password).toBeUndefined();

      // Ensure updateById stored the hashed refresh token
      expect(mockUsersService.updateById).toHaveBeenCalled();
      const updatedData = mockUsersService.updateById.mock.calls[0][1];
      expect(updatedData.refreshToken.startsWith('$2')).toBe(true);
    });
  });

  describe('Refresh Token Rotation & Revocation', () => {
    it('should rotate refresh token upon valid presentation', async () => {
      const plainRefreshToken = 'valid_raw_refresh_token';
      const hashedRefreshToken = await bcrypt.hash(plainRefreshToken, 10);

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user123',
        email: 'student@example.com',
      });

      mockUsersService.findById.mockResolvedValue({
        _id: 'user123',
        email: 'student@example.com',
        status: UserStatus.ACTIVE,
        refreshToken: hashedRefreshToken,
        roles: [Role.STUDENT],
      });

      const tokens = await authService.refreshToken(plainRefreshToken);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(mockUsersService.updateById).toHaveBeenCalled();
    });

    it('should reject revoked or tampered refresh token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user123',
      });

      mockUsersService.findById.mockResolvedValue({
        _id: 'user123',
        refreshToken: null, // Revoked
      });

      await expect(
        authService.refreshToken('some_revoked_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should revoke stored refresh token on logout', async () => {
      mockUsersService.findById.mockResolvedValue({
        _id: 'user123',
      });

      const result = await authService.logout('user123');
      expect(result.message).toBe('Logged out successfully');
      expect(mockUsersService.updateById).toHaveBeenCalledWith('user123', {
        refreshToken: null,
      });
    });
  });

  describe('Password Reset & OTP', () => {
    it('should not leak email existence on forgot password request', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const response = await authService.forgotPassword({
        email: 'nonexistent@example.com',
      });

      expect(response.message).toContain('If an account exists');
    });

    it('should reset password, clear OTP, and revoke existing sessions', async () => {
      const currentOtp = '654321';
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user123',
        email: 'student@example.com',
        otp: currentOtp,
        otpExpiresAt: new Date(Date.now() + 600000), // Valid for 10 min
      });

      const response = await authService.resetPassword({
        email: 'student@example.com',
        otp: currentOtp,
        newPassword: 'BrandNewPassword123!',
      });

      expect(response.message).toBe(
        'Password reset successfully. You can now log in.',
      );
      expect(mockUsersService.updateById).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          otp: null,
          otpExpiresAt: null,
          refreshToken: null,
        }),
      );
    });
  });
});
