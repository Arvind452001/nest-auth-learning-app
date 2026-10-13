import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { RegistrationFormsService } from '../registration-forms/registration-forms.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    sanitizeUser: vi.fn((u) => u),
  };

  const mockProfilesService = {
    createProfileForRegistration: vi.fn(),
    getProfilesForUser: vi.fn(),
  };

  const mockRegistrationFormsService = {
    validateSubmission: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mock_jwt_token'),
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ProfilesService, useValue: mockProfilesService },
        {
          provide: RegistrationFormsService,
          useValue: mockRegistrationFormsService,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
