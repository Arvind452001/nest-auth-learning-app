import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum.js';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    type: [String],
    enum: Object.values(Role),
    default: [Role.STUDENT],
    index: true,
  })
  roles: Role[];

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    index: true,
  })
  status: UserStatus;

  @Prop({
    default: false,
  })
  isEmailVerified: boolean;

  @Prop({ type: String, default: null })
  otp?: string | null;

  @Prop({ type: Date, default: null })
  otpExpiresAt?: Date | null;

  @Prop({ type: String, default: null })
  refreshToken?: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  customFields?: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RegistrationForm', default: null })
  registrationFormId?: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure fast email queries
UserSchema.index({ email: 1 });
