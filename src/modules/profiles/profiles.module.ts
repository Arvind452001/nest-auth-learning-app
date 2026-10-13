import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StudentProfile,
  StudentProfileSchema,
} from './schemas/student-profile.schema.js';
import {
  InterviewerProfile,
  InterviewerProfileSchema,
} from './schemas/interviewer-profile.schema.js';
import {
  TeacherProfile,
  TeacherProfileSchema,
} from './schemas/teacher-profile.schema.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: InterviewerProfile.name, schema: InterviewerProfileSchema },
      { name: TeacherProfile.name, schema: TeacherProfileSchema },
    ]),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService, MongooseModule],
})
export class ProfilesModule {}
