import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minimum: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: [Role.STUDENT, Role.INTERVIEWER, Role.TEACHER],
    default: Role.STUDENT,
    description: 'Target role for registration (STUDENT, INTERVIEWER, TEACHER)',
  })
  @IsOptional()
  @IsEnum([Role.STUDENT, Role.INTERVIEWER, Role.TEACHER])
  role?: Role = Role.STUDENT;
}