import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInterviewerProfileDto {
  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'Staff Engineer at Google | 10+ yrs exp',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional({ example: '10 years in backend system design' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ example: ['Distributed Systems', 'System Design', 'Go', 'NestJS'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'Staff Software Engineer' })
  @IsOptional()
  @IsString()
  currentDesignation?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: ['System Design', 'Coding', 'Behavioral'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interviewCategories?: string[];

  @ApiPropertyOptional({ example: 'Passionate about mentoring engineers' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({ example: 'Weekends, 2pm - 6pm EST' })
  @IsOptional()
  @IsString()
  availabilityPreferences?: string;
}
