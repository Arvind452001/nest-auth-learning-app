import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './common/config/database.config.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { RegistrationFormsModule } from './modules/registration-forms/registration-forms.module.js';

import { validateEnvironment } from './common/config/env.validation.js';

import { CommonModule } from './common/common.module.js';
import { ThrottlerModule } from '@nestjs/throttler';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
     ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // समय सीमा मिलीसेकंड में (यहाँ 60000 ms = 1 मिनट)
        limit: 10,  // इस समय सीमा में अधिकतम requests की संख्या
      },
    ]),
    
    CommonModule,
    DatabaseModule,
    UsersModule,
    ProfilesModule,
    AuthModule,
    RolesModule,
    RegistrationFormsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
