import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGO_URI') ||
          process.env.MONGO_URI ||
          'mongodb://localhost:27017/nest-auth';

        return {
          uri,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB connected successfully');
            });

            connection.on('error', (error: unknown) => {
              console.error('❌ MongoDB connection error:', error);
            });

            connection.on('disconnected', () => {
              console.log('⚠️ MongoDB disconnected');
            });

            return connection;
          },
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}