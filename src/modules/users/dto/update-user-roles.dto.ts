import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';

export class UpdateUserRolesDto {
  @ApiProperty({
    type: [String],
    enum: Role,
    example: [Role.STUDENT, Role.TEACHER],
    description: 'Updated list of roles assigned to the user',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles: Role[];
}
