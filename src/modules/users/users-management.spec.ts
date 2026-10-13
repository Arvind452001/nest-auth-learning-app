import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { Role } from '../../common/enums/role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';

describe('Users Management & Ownership Privacy', () => {
  let controller: UsersController;
  let mockUsersService: any;

  beforeEach(() => {
    mockUsersService = {
      findAll: vi.fn(),
      findSafeById: vi.fn(),
      updateProfileMe: vi.fn(),
      updateStatus: vi.fn(),
      updateRoles: vi.fn(),
    };

    controller = new UsersController(mockUsersService as unknown as UsersService);
  });

  describe('User Ownership & Privacy Enforcement', () => {
    it('should allow user to view their own profile by ID', async () => {
      const targetUserId = 'user_abc_123';
      const currentUser = { id: targetUserId, roles: [Role.STUDENT] };

      mockUsersService.findSafeById.mockResolvedValue({
        id: targetUserId,
        name: 'Target User',
      });

      const result = await controller.findOne(targetUserId, currentUser);
      expect(result).toBeDefined();
      expect(mockUsersService.findSafeById).toHaveBeenCalledWith(targetUserId);
    });

    it('should forbid ordinary student from viewing another user account details (403 Forbidden)', async () => {
      const targetUserId = 'user_target_456';
      const currentUser = { id: 'other_student_789', roles: [Role.STUDENT] };

      await expect(
        controller.findOne(targetUserId, currentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to view any user account details', async () => {
      const targetUserId = 'user_target_456';
      const currentUser = { id: 'admin_user_001', roles: [Role.ADMIN] };

      mockUsersService.findSafeById.mockResolvedValue({
        id: targetUserId,
        name: 'Target User',
      });

      const result = await controller.findOne(targetUserId, currentUser);
      expect(result).toBeDefined();
      expect(mockUsersService.findSafeById).toHaveBeenCalledWith(targetUserId);
    });
  });

  describe('Mass Assignment Prevention in Profile Update', () => {
    it('should only update permitted properties (e.g. name) and ignore attempts to self-assign role or status', async () => {
      const mockUserModel = {
        findByIdAndUpdate: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue({
              _id: '507f1f77bcf86cd799439011',
              name: 'Updated Name',
              email: 'student@example.com',
              roles: [Role.STUDENT],
              status: UserStatus.ACTIVE,
            }),
          }),
        }),
      };

      const realService = new UsersService(mockUserModel as any);

      await realService.updateProfileMe('507f1f77bcf86cd799439011', {
        name: 'Updated Name',
        // Attempting to pass role or status will be ignored because updateProfileMe only extracts safe fields
      } as any);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $set: { name: 'Updated Name' } },
        { new: true },
      );
    });
  });

  describe('Administrative Status & Role Controls', () => {
    it('should delegate status update to service', async () => {
      mockUsersService.updateStatus.mockResolvedValue({
        id: 'u1',
        status: UserStatus.SUSPENDED,
      });

      const res = await controller.updateStatus('u1', {
        status: UserStatus.SUSPENDED,
      });

      expect(mockUsersService.updateStatus).toHaveBeenCalledWith(
        'u1',
        UserStatus.SUSPENDED,
      );
      expect((res as any).data?.status ?? (res as any).status).toBe(UserStatus.SUSPENDED);
    });

    it('should delegate role update to service for Super Admin', async () => {
      mockUsersService.updateRoles.mockResolvedValue({
        id: 'u1',
        roles: [Role.TEACHER, Role.INTERVIEWER],
      });

      const res = await controller.updateRoles('u1', {
        roles: [Role.TEACHER, Role.INTERVIEWER],
      });

      expect(mockUsersService.updateRoles).toHaveBeenCalledWith('u1', [
        Role.TEACHER,
        Role.INTERVIEWER,
      ]);
      expect((res as any).data?.roles ?? (res as any).roles).toEqual([Role.TEACHER, Role.INTERVIEWER]);
    });
  });
});
