import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Role } from '../enums/role.enum.js';

describe('Security & Access Control Guards', () => {
  describe('JwtAuthGuard', () => {
    const guard = new JwtAuthGuard();

    it('should throw UnauthorizedException when token is missing or user is undefined', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with expired message when token expired', () => {
      expect(() =>
        guard.handleRequest(null, null, { message: 'jwt expired' }),
      ).toThrow('Access token has expired');
    });

    it('should return user payload when token is valid', () => {
      const user = { id: '123', email: 'test@example.com', roles: [Role.STUDENT] };
      const result = guard.handleRequest(null, user, null);
      expect(result).toEqual(user);
    });
  });

  describe('RolesGuard & Least-Privilege Access Control', () => {
    let reflector: Reflector;
    let guard: RolesGuard;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
    });

    const createMockContext = (user: any): ExecutionContext => {
      return {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as unknown as ExecutionContext;
    };

    it('should permit access when route has no required roles metadata', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const ctx = createMockContext({ id: '1', roles: [Role.STUDENT] });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should forbid student from accessing admin-only endpoint (403 Forbidden)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const ctx = createMockContext({ id: '1', roles: [Role.STUDENT] });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow Admin to access admin endpoint', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const ctx = createMockContext({ id: '2', roles: [Role.ADMIN] });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow Super Admin full access to any restricted role route', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const ctx = createMockContext({ id: '3', roles: [Role.SUPER_ADMIN] });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
