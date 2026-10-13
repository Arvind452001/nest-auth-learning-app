import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateTeacherProfileDto {
  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'Professor with 12 years of teaching computer science',
  })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({ example: '12 years lecturing at University level' })
  @IsOptional()
  @IsString()
  teachingExperience?: string;

  @ApiPropertyOptional({ example: ['Algorithms', 'Data Structures', 'Database Systems'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @ApiPropertyOptional({ example: ['Computer Science 101', 'Advanced Algorithms'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiPropertyOptional({ example: ['PhD in Computer Science', 'M.S. in Software Engineering'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications?: string[];
}
