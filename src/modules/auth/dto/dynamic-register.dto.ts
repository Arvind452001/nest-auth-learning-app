import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmptyObject, IsObject } from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';

export class DynamicRegisterDto {
  @ApiProperty({
    enum: [Role.STUDENT, Role.INTERVIEWER, Role.TEACHER],
    example: Role.STUDENT,
    description: 'Target role for registration',
  })
  @IsEnum([Role.STUDENT, Role.INTERVIEWER, Role.TEACHER], {
    message: 'targetRole must be one of: STUDENT, INTERVIEWER, TEACHER',
  })
  targetRole: Role;

  @ApiProperty({
    example: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPassword123!',
      phone: '+1234567890',
      collegeOrUniversity: 'MIT',
      skills: ['TypeScript', 'NestJS'],
    },
    description: 'Form submission fields matching active registration form schema',
  })
  @IsObject()
  @IsNotEmptyObject()
  formData: Record<string, any>;
}
