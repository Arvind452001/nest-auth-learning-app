import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service.js';
import { User } from './schemas/user.schema.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';

describe('UsersService', () => {
  let service: UsersService;
  const mockUserModel = {
    create: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sanitize user object removing password and tokens', () => {
    const rawUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Student',
      email: 'student@example.com',
      password: 'hashed_password',
      refreshToken: 'hashed_refresh',
      otp: '123456',
      roles: [Role.STUDENT],
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      customFields: {},
    };

    const sanitized = service.sanitizeUser(rawUser);

    expect(sanitized!.id).toBe('507f1f77bcf86cd799439011');
    expect((sanitized as any).password).toBeUndefined();
    expect((sanitized as any).refreshToken).toBeUndefined();
    expect((sanitized as any).otp).toBeUndefined();
    expect(sanitized!.roles).toEqual([Role.STUDENT]);
  });
});
