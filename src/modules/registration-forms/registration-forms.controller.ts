import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { CreateRegistrationFormDto } from './dto/create-form.dto.js';
import { UpdateRegistrationFormDto } from './dto/update-form.dto.js';
import { RegistrationFormsService } from './registration-forms.service.js';

@ApiTags('Registration Forms')
@Controller('registration-forms')
export class RegistrationFormsController {
  constructor(
    private readonly formsService: RegistrationFormsService,
  ) {}

  @ApiOperation({
    summary: 'Public: Get published registration form schema for a role',
  })
  @ApiParam({
    name: 'role',
    enum: [Role.STUDENT, Role.INTERVIEWER, Role.TEACHER],
    description: 'Target role for registration',
  })
  @ApiResponse({
    status: 200,
    description: 'Active form schema ready for dynamic UI rendering',
  })
  @Get('active/:role')
  findActiveByRole(@Param('role') role: string) {
    return this.formsService.findActiveByRole(role);
  }

  @ApiOperation({ summary: 'Admin: Create a dynamic registration form' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateRegistrationFormDto) {
    return this.formsService.create(dto);
  }

  @ApiOperation({ summary: 'Admin: List all registration forms' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.formsService.findAll();
  }

  @ApiOperation({ summary: 'Admin: Get registration form by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @ApiOperation({ summary: 'Admin: Update registration form definition' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationFormDto,
  ) {
    return this.formsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Admin: Publish a registration form' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.formsService.publish(id);
  }

  @ApiOperation({ summary: 'Admin: Unpublish a registration form' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.formsService.unpublish(id);
  }

  @ApiOperation({
    summary: 'Admin: Create a new version of an existing form',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/version')
  createVersion(@Param('id') id: string) {
    return this.formsService.createVersion(id);
  }
}
