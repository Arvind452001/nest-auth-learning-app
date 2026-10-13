import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RolesService } from './roles.service.js';
import { Role } from './schemas/role.schema.js';

describe('RolesService', () => {
  let service: RolesService;

  const mockRoleModel = {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getModelToken(Role.name),
          useValue: mockRoleModel,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
