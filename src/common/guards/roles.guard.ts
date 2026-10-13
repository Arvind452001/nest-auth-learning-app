import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { Role } from '../enums/role.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(Role | string)[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    const rawRoles = user.roles ?? (user.role ? [user.role] : []);
    const userRoles: string[] = Array.isArray(rawRoles)
      ? rawRoles.map((r: string) => String(r).toUpperCase())
      : [String(rawRoles).toUpperCase()];

    // SUPER_ADMIN has supreme access to any role-protected resource
    if (userRoles.includes(Role.SUPER_ADMIN)) {
      return true;
    }

    const normalizedRequired = requiredRoles.map((r) =>
      String(r).toUpperCase(),
    );

    const hasPermission = normalizedRequired.some((reqRole) =>
      userRoles.includes(reqRole),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
