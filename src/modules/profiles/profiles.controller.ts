import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import {
  CloudinaryService,
  UploadableFile,
} from '../../common/services/cloudinary.service.js';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  @ApiOperation({
    summary: 'Upload avatar to Cloudinary and update current user profile',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseGuards(ThrottlerGuard)
@Throttle({default: {limit: 3,ttl: 86400000}})
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: any,
  ) {
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'careerlaunch/avatars',
    );
    await this.profilesService.updateAvatarUrl(userId, uploadResult.secureUrl);
    return {
      message: 'Avatar uploaded and updated successfully',
      url: uploadResult.secureUrl,
      publicId: uploadResult.publicId,
    };
  }

  @ApiOperation({ summary: 'Upload general image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upload-image')
  @UseGuards(ThrottlerGuard)
@Throttle({default: {limit: 3,ttl: 86400000}})
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any) {
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'careerlaunch/uploads',
    );
    return {
      message: 'Image uploaded successfully',
      url: uploadResult.secureUrl,
      publicId: uploadResult.publicId,
    };
  }
}
