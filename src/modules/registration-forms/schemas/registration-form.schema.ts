import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../../common/enums/role.enum.js';
import { FormFieldType } from '../../../common/enums/form-field-type.enum.js';

export type RegistrationFormDocument = HydratedDocument<RegistrationForm>;

@Schema({ _id: false })
export class FormValidationRules {
  @Prop({ type: Number })
  min?: number;

  @Prop({ type: Number })
  max?: number;

  @Prop({ type: Number })
  minLength?: number;

  @Prop({ type: Number })
  maxLength?: number;

  @Prop({ type: String })
  pattern?: string;
}

export const FormValidationRulesSchema =
  SchemaFactory.createForClass(FormValidationRules);

@Schema({ _id: false })
export class FormField {
  @Prop({
    required: true,
    trim: true,
    match: /^[a-zA-Z][a-zA-Z0-9_]*$/,
  })
  key: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({
    type: String,
    enum: Object.values(FormFieldType),
    required: true,
  })
  type: FormFieldType;

  @Prop({ default: false })
  required: boolean;

  @Prop({ default: '' })
  placeholder: string;

  @Prop({ default: '' })
  helpText: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ type: FormValidationRulesSchema, default: {} })
  validation?: FormValidationRules;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  enabled: boolean;
}

export const FormFieldSchema = SchemaFactory.createForClass(FormField);

@Schema({ timestamps: true })
export class RegistrationForm {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    required: true,
    index: true,
  })
  targetRole: Role;

  @Prop({ default: 1 })
  version: number;

  @Prop({ default: false, index: true })
  isPublished: boolean;

  @Prop({ type: Date, default: null })
  publishedAt?: Date;

  @Prop({ type: [FormFieldSchema], default: [] })
  fields: FormField[];
}

export const RegistrationFormSchema =
  SchemaFactory.createForClass(RegistrationForm);

RegistrationFormSchema.index({ targetRole: 1, isPublished: 1 });
