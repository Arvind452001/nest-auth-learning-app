import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { RegistrationFormsService } from './registration-forms.service.js';
import { Role } from '../../common/enums/role.enum.js';
import { FormFieldType } from '../../common/enums/form-field-type.enum.js';

describe('RegistrationFormsService & Dynamic Form Rules', () => {
  let service: RegistrationFormsService;
  let mockFormModel: any;

  beforeEach(() => {
    mockFormModel = {
      create: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      updateMany: vi.fn(),
    };

    service = new RegistrationFormsService(mockFormModel);
  });

  it('should reject creating a registration form for privileged ADMIN role', async () => {
    await expect(
      service.create({
        title: 'Admin Form',
        targetRole: Role.ADMIN as any,
        fields: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject field definitions with duplicate keys', async () => {
    await expect(
      service.create({
        title: 'Student Form',
        targetRole: Role.STUDENT,
        fields: [
          {
            key: 'phone',
            label: 'Phone',
            type: FormFieldType.PHONE,
            required: true,
          },
          {
            key: 'phone',
            label: 'Phone 2',
            type: FormFieldType.PHONE,
            required: false,
          },
        ] as any,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject select/radio fields without options', async () => {
    await expect(
      service.create({
        title: 'Student Form',
        targetRole: Role.STUDENT,
        fields: [
          {
            key: 'level',
            label: 'Skill Level',
            type: FormFieldType.SELECT,
            options: [],
          },
        ] as any,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject submission with forbidden protected field keys (e.g. role, isAdmin)', async () => {
    const publishedForm = {
      _id: '507f1f77bcf86cd799439011',
      targetRole: Role.STUDENT,
      isPublished: true,
      fields: [
        {
          key: 'name',
          label: 'Full Name',
          type: FormFieldType.TEXT,
          required: true,
          enabled: true,
        },
        {
          key: 'email',
          label: 'Email',
          type: FormFieldType.EMAIL,
          required: true,
          enabled: true,
        },
        {
          key: 'password',
          label: 'Password',
          type: FormFieldType.PASSWORD,
          required: true,
          enabled: true,
        },
      ],
    };

    mockFormModel.findOne.mockResolvedValue(publishedForm);

    await expect(
      service.validateSubmission(Role.STUDENT, {
        name: 'Attacker',
        email: 'attacker@example.com',
        password: 'password123',
        role: 'SUPER_ADMIN',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.validateSubmission(Role.STUDENT, {
        name: 'Attacker',
        email: 'attacker@example.com',
        password: 'password123',
        isAdmin: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject submission when required field is missing', async () => {
    const publishedForm = {
      _id: '507f1f77bcf86cd799439011',
      targetRole: Role.STUDENT,
      isPublished: true,
      fields: [
        {
          key: 'name',
          label: 'Full Name',
          type: FormFieldType.TEXT,
          required: true,
          enabled: true,
        },
        {
          key: 'email',
          label: 'Email',
          type: FormFieldType.EMAIL,
          required: true,
          enabled: true,
        },
        {
          key: 'password',
          label: 'Password',
          type: FormFieldType.PASSWORD,
          required: true,
          enabled: true,
        },
        {
          key: 'collegeOrUniversity',
          label: 'College or University',
          type: FormFieldType.TEXT,
          required: true,
          enabled: true,
        },
      ],
    };

    mockFormModel.findOne.mockResolvedValue(publishedForm);

    await expect(
      service.validateSubmission(Role.STUDENT, {
        name: 'Student',
        email: 'student@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully validate submission and separate credentials, profile, and custom fields', async () => {
    const publishedForm = {
      _id: '507f1f77bcf86cd799439011',
      targetRole: Role.STUDENT,
      isPublished: true,
      fields: [
        {
          key: 'name',
          label: 'Full Name',
          type: FormFieldType.TEXT,
          required: true,
          enabled: true,
        },
        {
          key: 'email',
          label: 'Email',
          type: FormFieldType.EMAIL,
          required: true,
          enabled: true,
        },
        {
          key: 'password',
          label: 'Password',
          type: FormFieldType.PASSWORD,
          required: true,
          enabled: true,
        },
        {
          key: 'phone',
          label: 'Phone',
          type: FormFieldType.PHONE,
          required: false,
          enabled: true,
        },
        {
          key: 'customReferralCode',
          label: 'Referral Code',
          type: FormFieldType.TEXT,
          required: false,
          enabled: true,
        },
      ],
    };

    mockFormModel.findOne.mockResolvedValue(publishedForm);

    const result = await service.validateSubmission(Role.STUDENT, {
      name: 'Valid Student',
      email: 'student@mit.edu',
      password: 'securePassword123!',
      phone: '+1 234 567 8900',
      customReferralCode: 'CAMPUS2026',
    });

    expect(result.credentials.email).toBe('student@mit.edu');
    expect(result.profileData.phone).toBe('+1 234 567 8900');
    expect(result.customFields.customReferralCode).toBe('CAMPUS2026');
  });
});
