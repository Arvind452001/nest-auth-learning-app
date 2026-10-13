import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { ProfilesService } from './profiles.service.js';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let mockStudentModel: any;
  let mockInterviewerModel: any;
  let mockTeacherModel: any;

  beforeEach(() => {
    mockStudentModel = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
    };
    mockInterviewerModel = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
    };
    mockTeacherModel = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
    };

    service = new ProfilesService(
      mockStudentModel,
      mockInterviewerModel,
      mockTeacherModel,
    );
  });

  const validObjectId = '507f1f77bcf86cd799439011';

  it('should prevent self-assigning verified status when updating interviewer profile', async () => {
    mockInterviewerModel.findOneAndUpdate.mockResolvedValue({
      userId: validObjectId,
      headline: 'Software Engineer',
      verificationStatus: VerificationStatus.PENDING,
    });

    await service.updateMyProfile(validObjectId, {
      interviewer: {
        headline: 'Staff Engineer',
        // Attempting to self-verify
        verificationStatus: VerificationStatus.VERIFIED as any,
      } as any,
    });

    expect(mockInterviewerModel.findOneAndUpdate).toHaveBeenCalled();
    const updateArg = mockInterviewerModel.findOneAndUpdate.mock.calls[0][1];
    // verificationStatus MUST NOT be passed to DB update in user update flow
    expect(updateArg.$set.verificationStatus).toBeUndefined();
    expect(updateArg.$set.headline).toBe('Staff Engineer');
  });

  it('should allow admin to verify interviewer profile', async () => {
    mockInterviewerModel.findOneAndUpdate.mockResolvedValue({
      userId: validObjectId,
      verificationStatus: VerificationStatus.VERIFIED,
    });

    const res = await service.setVerificationStatus(
      validObjectId,
      'interviewer',
      VerificationStatus.VERIFIED,
    );

    expect(mockInterviewerModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: new Types.ObjectId(validObjectId) },
      { $set: { verificationStatus: VerificationStatus.VERIFIED } },
      { new: true },
    );
    expect(res.verificationStatus).toBe(VerificationStatus.VERIFIED);
  });

  it('should create initial role profile during user registration', async () => {
    mockStudentModel.create.mockResolvedValue({
      userId: validObjectId,
      collegeOrUniversity: 'Stanford University',
      skills: ['TypeScript', 'NestJS'],
    });

    const studentProfile = await service.createProfileForRegistration(
      new Types.ObjectId(validObjectId),
      Role.STUDENT,
      {
        collegeOrUniversity: 'Stanford University',
        skills: ['TypeScript', 'NestJS'],
      },
    );

    expect(mockStudentModel.create).toHaveBeenCalled();
    expect((studentProfile as any)?.collegeOrUniversity).toBe('Stanford University');
  });
});
