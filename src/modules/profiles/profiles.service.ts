import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum.js';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';
import {
  StudentProfile,
  StudentProfileDocument,
} from './schemas/student-profile.schema.js';
import {
  InterviewerProfile,
  InterviewerProfileDocument,
} from './schemas/interviewer-profile.schema.js';
import {
  TeacherProfile,
  TeacherProfileDocument,
} from './schemas/teacher-profile.schema.js';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto.js';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(InterviewerProfile.name)
    private readonly interviewerProfileModel: Model<InterviewerProfileDocument>,
    @InjectModel(TeacherProfile.name)
    private readonly teacherProfileModel: Model<TeacherProfileDocument>,
  ) {}

  async getProfilesForUser(userId: string) {
    this.validateId(userId);
    const userObjectId = new Types.ObjectId(userId);

    const [student, interviewer, teacher] = await Promise.all([
      this.studentProfileModel.findOne({ userId: userObjectId }).lean(),
      this.interviewerProfileModel.findOne({ userId: userObjectId }).lean(),
      this.teacherProfileModel.findOne({ userId: userObjectId }).lean(),
    ]);

    return {
      student: student ?? null,
      interviewer: interviewer ?? null,
      teacher: teacher ?? null,
    };
  }

  async getPublicProfile(userId: string) {
    this.validateId(userId);
    const userObjectId = new Types.ObjectId(userId);

    const [student, interviewer, teacher] = await Promise.all([
      this.studentProfileModel
        .findOne({ userId: userObjectId })
        .select('-phone')
        .lean(),
      this.interviewerProfileModel
        .findOne({ userId: userObjectId })
        .select('-phone')
        .lean(),
      this.teacherProfileModel
        .findOne({ userId: userObjectId })
        .select('-phone')
        .lean(),
    ]);

    if (!student && !interviewer && !teacher) {
      throw new NotFoundException('Profile not found');
    }

    return {
      student,
      interviewer,
      teacher,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    this.validateId(userId);
    const userObjectId = new Types.ObjectId(userId);
    const results: Record<string, any> = {};

    if (dto.student) {
      results.student = await this.studentProfileModel.findOneAndUpdate(
        { userId: userObjectId },
        { $set: dto.student },
        { new: true, upsert: true, runValidators: true },
      );
    }

    if (dto.interviewer) {
      // Prevent mass-assignment of verificationStatus
      const safeData = { ...dto.interviewer };
      delete (safeData as any).verificationStatus;

      results.interviewer = await this.interviewerProfileModel.findOneAndUpdate(
        { userId: userObjectId },
        { $set: safeData },
        { new: true, upsert: true, runValidators: true },
      );
    }

    if (dto.teacher) {
      // Prevent mass-assignment of verificationStatus
      const safeData = { ...dto.teacher };
      delete (safeData as any).verificationStatus;

      results.teacher = await this.teacherProfileModel.findOneAndUpdate(
        { userId: userObjectId },
        { $set: safeData },
        { new: true, upsert: true, runValidators: true },
      );
    }

    return {
      message: 'Profile updated successfully',
      data: results,
    };
  }

  async createProfileForRegistration(
    userId: Types.ObjectId,
    role: Role,
    data: Record<string, any>,
  ) {
    switch (role) {
      case Role.STUDENT:
        return this.studentProfileModel.create({
          userId,
          phone: data.phone ?? '',
          avatarUrl: data.avatarUrl ?? '',
          education: data.education ?? '',
          collegeOrUniversity: data.collegeOrUniversity ?? '',
          skills: Array.isArray(data.skills)
            ? data.skills
            : data.skills
              ? [data.skills]
              : [],
          experienceLevel: data.experienceLevel ?? 'Beginner',
          resumeUrl: data.resumeUrl ?? '',
          careerGoals: data.careerGoals ?? '',
          profileCompletionPercentage: 50,
        });

      case Role.INTERVIEWER:
        return this.interviewerProfileModel.create({
          userId,
          phone: data.phone ?? '',
          avatarUrl: data.avatarUrl ?? '',
          headline: data.headline ?? '',
          experience: data.experience ?? '',
          skills: Array.isArray(data.skills)
            ? data.skills
            : data.skills
              ? [data.skills]
              : [],
          currentDesignation: data.currentDesignation ?? '',
          company: data.company ?? '',
          interviewCategories: Array.isArray(data.interviewCategories)
            ? data.interviewCategories
            : data.interviewCategories
              ? [data.interviewCategories]
              : [],
          verificationStatus: VerificationStatus.PENDING,
          biography: data.biography ?? '',
          availabilityPreferences: data.availabilityPreferences ?? '',
        });

      case Role.TEACHER:
        return this.teacherProfileModel.create({
          userId,
          phone: data.phone ?? '',
          avatarUrl: data.avatarUrl ?? '',
          biography: data.biography ?? '',
          teachingExperience: data.teachingExperience ?? '',
          expertise: Array.isArray(data.expertise)
            ? data.expertise
            : data.expertise
              ? [data.expertise]
              : [],
          subjects: Array.isArray(data.subjects)
            ? data.subjects
            : data.subjects
              ? [data.subjects]
              : [],
          qualifications: Array.isArray(data.qualifications)
            ? data.qualifications
            : data.qualifications
              ? [data.qualifications]
              : [],
          verificationStatus: VerificationStatus.PENDING,
        });

      default:
        return null;
    }
  }

  async setVerificationStatus(
    userId: string,
    profileType: 'interviewer' | 'teacher',
    status: VerificationStatus,
  ) {
    this.validateId(userId);
    const userObjectId = new Types.ObjectId(userId);

    if (profileType === 'interviewer') {
      const updated = await this.interviewerProfileModel.findOneAndUpdate(
        { userId: userObjectId },
        { $set: { verificationStatus: status } },
        { new: true },
      );
      if (!updated) {
        throw new NotFoundException('Interviewer profile not found');
      }
      return updated;
    } else if (profileType === 'teacher') {
      const updated = await this.teacherProfileModel.findOneAndUpdate(
        { userId: userObjectId },
        { $set: { verificationStatus: status } },
        { new: true },
      );
      if (!updated) {
        throw new NotFoundException('Teacher profile not found');
      }
      return updated;
    }

    throw new BadRequestException('Invalid profile type for verification');
  }

  private validateId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }
  }
}
