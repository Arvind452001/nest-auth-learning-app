import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { VerificationStatus } from '../../../common/enums/verification-status.enum.js';

export type InterviewerProfileDocument = HydratedDocument<InterviewerProfile>;

@Schema({ timestamps: true })
export class InterviewerProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  headline: string;

  @Prop({ default: '' })
  experience: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ default: '' })
  currentDesignation: string;

  @Prop({ default: '' })
  company: string;

  @Prop({ type: [String], default: [] })
  interviewCategories: string[];

  @Prop({
    type: String,
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
    index: true,
  })
  verificationStatus: VerificationStatus;

  @Prop({ default: '' })
  biography: string;

  @Prop({ default: '' })
  availabilityPreferences: string;
}

export const InterviewerProfileSchema =
  SchemaFactory.createForClass(InterviewerProfile);
