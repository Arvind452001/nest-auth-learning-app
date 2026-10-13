import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto.js';
import { ProfilesService } from './profiles.service.js';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @ApiOperation({ summary: 'Get current user profile(s)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfiles(@CurrentUser('id') userId: string) {
    return this.profilesService.getProfilesForUser(userId);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.profilesService.updateMyProfile(userId, dto);
  }

  @ApiOperation({ summary: 'Get public profile for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Get(':userId')
  getPublicProfile(@Param('userId') userId: string) {
    return this.profilesService.getPublicProfile(userId);
  }

  @ApiOperation({
    summary: 'Admin: Verify interviewer or teacher profile',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'type',
    enum: ['interviewer', 'teacher'],
    description: 'Profile type to verify',
  })
  @Patch(':userId/verify')
  verifyProfile(
    @Param('userId') userId: string,
    @Query('type') type: 'interviewer' | 'teacher',
    @Body('status') status: VerificationStatus,
  ) {
    return this.profilesService.setVerificationStatus(userId, type, status);
  }
}
