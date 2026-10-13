import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ example: 'BrandNewPassword123!', minimum: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}