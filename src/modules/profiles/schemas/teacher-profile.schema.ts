import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { VerificationStatus } from '../../../common/enums/verification-status.enum.js';

export type TeacherProfileDocument = HydratedDocument<TeacherProfile>;

@Schema({ timestamps: true })
export class TeacherProfile {
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
  biography: string;

  @Prop({ default: '' })
  teachingExperience: string;

  @Prop({ type: [String], default: [] })
  expertise: string[];

  @Prop({ type: [String], default: [] })
  subjects: string[];

  @Prop({ type: [String], default: [] })
  qualifications: string[];

  @Prop({
    type: String,
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
    index: true,
  })
  verificationStatus: VerificationStatus;
}

export const TeacherProfileSchema =
  SchemaFactory.createForClass(TeacherProfile);
