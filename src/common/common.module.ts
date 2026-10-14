import { Global, Module } from '@nestjs/common';
import { MailService } from './services/mail.service.js';
import { CloudinaryService } from './services/cloudinary.service.js';

@Global()
@Module({
  providers: [MailService, CloudinaryService],
  exports: [MailService, CloudinaryService],
})
export class CommonModule {}
