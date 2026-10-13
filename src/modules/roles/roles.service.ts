import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const name = createRoleDto.name.trim().toUpperCase();

    const existingRole = await this.roleModel.findOne({ name });
    if (existingRole) {
      throw new ConflictException(`Role with name "${name}" already exists`);
    }

    const role = await this.roleModel.create({
      ...createRoleDto,
      name,
    });

    return {
      message: 'Role created successfully',
      data: role,
    };
  }

  async findAll() {
    const roles = await this.roleModel
      .find()
      .sort({ createdAt: -1 })
      .lean();

    return {
      count: roles.length,
      data: roles,
    };
  }

  async findRegistrationRoles() {
    const roles = await this.roleModel
      .find({
        isActive: true,
        isPublicRegistration: true,
      })
      .select('name displayName description')
      .sort({ displayName: 1 })
      .lean();

    return {
      count: roles.length,
      data: roles,
    };
  }

  async findOne(id: string) {
    this.validateId(id);

    const role = await this.roleModel.findById(id).lean();
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return { data: role };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    this.validateId(id);

    const updateData: Partial<CreateRoleDto> = { ...updateRoleDto };
    if (updateData.name !== undefined) {
      updateData.name = updateData.name.trim().toUpperCase();
    }

    const role = await this.roleModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      message: 'Role updated successfully',
      data: role,
    };
  }

  async remove(id: string) {
    this.validateId(id);

    const role = await this.roleModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false, isPublicRegistration: false } },
      { new: true, runValidators: true },
    );

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      message: 'Role deactivated successfully',
      data: role,
    };
  }

  private validateId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid role ID format');
    }
  }
}
