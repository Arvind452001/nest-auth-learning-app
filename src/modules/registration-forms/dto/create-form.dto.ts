import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';
import { FormFieldDto } from './form-field.dto.js';

export class CreateRegistrationFormDto {
  @ApiProperty({
    example: 'Student Registration Form v1',
    description: 'Title of the registration form',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ example: 'Standard onboarding form for students' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    enum: [Role.STUDENT, Role.INTERVIEWER, Role.TEACHER],
    example: Role.STUDENT,
    description: 'Target role for this registration form',
  })
  @IsEnum([Role.STUDENT, Role.INTERVIEWER, Role.TEACHER], {
    message: 'targetRole must be one of: STUDENT, INTERVIEWER, TEACHER',
  })
  targetRole: Role;

  @ApiProperty({
    type: [FormFieldDto],
    description: 'List of form fields configured for this form',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];
}
