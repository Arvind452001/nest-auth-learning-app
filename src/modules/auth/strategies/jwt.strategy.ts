import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret =
      configService.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_ACCESS_SECRET;

    if (!secret && process.env.NODE_ENV !== 'test') {
      throw new Error('JWT_ACCESS_SECRET is not configured in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'test_jwt_access_secret_only_for_unit_tests',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('User account has been suspended');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is inactive');
    }

    const roles = user.roles ?? [];

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
