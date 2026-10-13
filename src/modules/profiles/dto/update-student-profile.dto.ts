import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStudentProfileDto {
  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Bachelor of Technology' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  education?: string;

  @ApiPropertyOptional({ example: 'Stanford University' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  collegeOrUniversity?: string;

  @ApiPropertyOptional({ example: ['JavaScript', 'NestJS', 'React'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'Intermediate' })
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiPropertyOptional({ example: 'https://example.com/resume.pdf' })
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiPropertyOptional({ example: 'Become a Senior Fullstack Engineer' })
  @IsOptional()
  @IsString()
  careerGoals?: string;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  profileCompletionPercentage?: number;
}
