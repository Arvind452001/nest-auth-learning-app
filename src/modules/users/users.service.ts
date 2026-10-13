import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Role } from '../../common/enums/role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { User, UserDocument } from './schemas/user.schema.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });
  }

  async findById(id: string) {
    this.validateId(id);
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findSafeById(id: string) {
    this.validateId(id);
    const user = await this.userModel
      .findById(id)
      .select('-password -refreshToken -otp -otpExpiresAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findAll(query: PaginationDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.role) {
      filter.roles = query.role.toUpperCase();
    }

    if (query.status) {
      filter.status = query.status.toUpperCase();
    }

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [total, users] = await Promise.all([
      this.userModel.countDocuments(filter),
      this.userModel
        .find(filter)
        .select('-password -refreshToken -otp -otpExpiresAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      data: users.map((u) => this.sanitizeUser(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateById(id: string, data: Partial<User>) {
    this.validateId(id);
    return this.userModel.findByIdAndUpdate(id, data, { new: true });
  }

  async updateProfileMe(userId: string, dto: UpdateUserDto) {
    this.validateId(userId);

    // Only allow safe properties (e.g. name)
    const updatePayload: Partial<User> = {};
    if (dto.name !== undefined) {
      updatePayload.name = dto.name.trim();
    }

    const updated = await this.userModel
      .findByIdAndUpdate(userId, { $set: updatePayload }, { new: true })
      .select('-password -refreshToken -otp -otpExpiresAt')
      .lean();

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User profile updated successfully',
      data: this.sanitizeUser(updated),
    };
  }

  async updateStatus(id: string, status: UserStatus) {
    this.validateId(id);

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true },
      )
      .select('-password -refreshToken -otp -otpExpiresAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: `User status changed to ${status}`,
      data: this.sanitizeUser(user),
    };
  }

  async updateRoles(id: string, roles: Role[]) {
    this.validateId(id);

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { roles } },
        { new: true },
      )
      .select('-password -refreshToken -otp -otpExpiresAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User roles updated successfully',
      data: this.sanitizeUser(user),
    };
  }

  public sanitizeUser(user: any) {
    if (!user) return null;
    const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.refreshToken;
    delete obj.otp;
    delete obj.otpExpiresAt;
    delete obj.__v;

    return {
      id: obj._id?.toString() ?? obj.id,
      name: obj.name,
      email: obj.email,
      roles: obj.roles ?? (obj.role ? [obj.role] : []),
      status: obj.status,
      isEmailVerified: obj.isEmailVerified,
      customFields: obj.customFields ?? {},
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  private validateId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }
  }
}