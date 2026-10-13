import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'New account status',
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
