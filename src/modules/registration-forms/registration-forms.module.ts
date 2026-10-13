import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RegistrationForm,
  RegistrationFormSchema,
} from './schemas/registration-form.schema.js';
import { RegistrationFormsController } from './registration-forms.controller.js';
import { RegistrationFormsService } from './registration-forms.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistrationForm.name, schema: RegistrationFormSchema },
    ]),
  ],
  controllers: [RegistrationFormsController],
  providers: [RegistrationFormsService],
  exports: [RegistrationFormsService, MongooseModule],
})
export class RegistrationFormsModule {}
