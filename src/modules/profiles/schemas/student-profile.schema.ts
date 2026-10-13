import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type StudentProfileDocument = HydratedDocument<StudentProfile>;

@Schema({ timestamps: true })
export class StudentProfile {
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
  education: string;

  @Prop({ default: '' })
  collegeOrUniversity: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ default: 'Beginner' })
  experienceLevel: string;

  @Prop({ default: '' })
  resumeUrl: string;

  @Prop({ default: '' })
  careerGoals: string;

  @Prop({ default: 0, min: 0, max: 100 })
  profileCompletionPercentage: number;
}

export const StudentProfileSchema =
  SchemaFactory.createForClass(StudentProfile);
