import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { UpdateStudentProfileDto } from './update-student-profile.dto.js';
import { UpdateInterviewerProfileDto } from './update-interviewer-profile.dto.js';
import { UpdateTeacherProfileDto } from './update-teacher-profile.dto.js';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ type: UpdateStudentProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateStudentProfileDto)
  student?: UpdateStudentProfileDto;

  @ApiPropertyOptional({ type: UpdateInterviewerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateInterviewerProfileDto)
  interviewer?: UpdateInterviewerProfileDto;

  @ApiPropertyOptional({ type: UpdateTeacherProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateTeacherProfileDto)
  teacher?: UpdateTeacherProfileDto;
}
