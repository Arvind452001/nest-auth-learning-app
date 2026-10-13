import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { RegistrationFormsModule } from '../registration-forms/registration-forms.module.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    ProfilesModule,
    RegistrationFormsModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}