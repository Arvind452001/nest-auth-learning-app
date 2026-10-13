import { PartialType } from '@nestjs/swagger';
import { CreateRegistrationFormDto } from './create-form.dto.js';

export class UpdateRegistrationFormDto extends PartialType(
  CreateRegistrationFormDto,
) {}
