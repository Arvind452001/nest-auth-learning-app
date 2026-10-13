import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'TEACHER', description: 'Unique role identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
  name: string;

  @ApiProperty({ example: 'Teacher', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({ example: 'Instructors and educators' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: ['read:profile', 'conduct:interview'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublicRegistration?: boolean;
}
