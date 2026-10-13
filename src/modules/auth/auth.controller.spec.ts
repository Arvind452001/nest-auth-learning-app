import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: vi.fn(),
    dynamicRegister: vi.fn(),
    login: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    verifyForgotOtp: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmailOtp: vi.fn(),
    resendOtp: vi.fn(),
    getMe: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
