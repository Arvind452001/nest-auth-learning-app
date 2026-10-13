import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { RegisterDto } from './dto/register.dto.js';
import { DynamicRegisterDto } from './dto/dynamic-register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { AuthService } from './auth.service.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Health check endpoint' })
  @Get('health')
  healthCheck() {
    return {
      success: true,
      message: 'Server is healthy, APIs running',
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({
    summary: 'Public: Register user using dynamic published form',
  })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @Post('register')
  register(@Body() dto: DynamicRegisterDto) {
    return this.authService.dynamicRegister(dto);
  }

  @ApiOperation({
    summary: 'Public: Direct fallback registration with basic fields',
  })
  @Post('direct-register')
  directRegister(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Public: Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account suspended/pending' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Public: Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully' })
  @Post('refresh-token')
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Get current authenticated user info and profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @ApiOperation({ summary: 'Revoke refresh token and logout' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @ApiOperation({ summary: 'Change user password' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @ApiOperation({ summary: 'Public: Request password reset OTP' })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Public: Verify password reset OTP' })
  @Post('verify-forgot-otp')
  verifyForgotOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyForgotOtp(dto);
  }

  @ApiOperation({ summary: 'Public: Reset password with OTP' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'Public: Verify email with OTP' })
  @Post('verify-email-otp')
  verifyEmailOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyEmailOtp(dto);
  }

  @ApiOperation({ summary: 'Public: Resend email verification OTP' })
  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }
}
