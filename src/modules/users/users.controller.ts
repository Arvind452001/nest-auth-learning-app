import {
  Body,
  Controller,
  ForbiddenException,
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
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Admin: List users with pagination, search, filters',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ summary: 'Get currently authenticated user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findSafeById(userId);
  }



  @ApiOperation({ summary: 'Update currently authenticated user details' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfileMe(userId, dto);
  }

  @ApiOperation({ summary: 'Get user details by ID (Admin or Self)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'User ID' })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const isOwner = currentUser?.id === id;
    const rawRoles =
      currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
    const roles: string[] = Array.isArray(rawRoles)
      ? rawRoles.map((r: string) => String(r).toUpperCase())
      : [String(rawRoles).toUpperCase()];

    const isAdmin =
      roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to view other users account details',
      );
    }

    return this.usersService.findSafeById(id);
  }

  @ApiOperation({ summary: 'Admin: Change user account status' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiParam({ name: 'id', description: 'User ID' })
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto.status);
  }

  @ApiOperation({ summary: 'Super Admin: Update user roles' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiParam({ name: 'id', description: 'User ID' })
  @Patch(':id/roles')
  updateRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
    return this.usersService.updateRoles(id, dto.roles);
  }
}
