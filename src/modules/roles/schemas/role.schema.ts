import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  name: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  isPublicRegistration: boolean;

  @Prop({ default: false })
  isSystem: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
