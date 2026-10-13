import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Role } from '../../common/enums/role.enum.js';
import { FormFieldType } from '../../common/enums/form-field-type.enum.js';
import {
  RegistrationForm,
  RegistrationFormDocument,
} from './schemas/registration-form.schema.js';
import { CreateRegistrationFormDto } from './dto/create-form.dto.js';
import { UpdateRegistrationFormDto } from './dto/update-form.dto.js';

const FORBIDDEN_SUBMISSION_KEYS = new Set([
  'role',
  'roles',
  'isadmin',
  'issuperadmin',
  'status',
  'isemailverified',
  'otp',
  'otpexpiresat',
  'refreshtoken',
  'permissions',
  '_id',
  'id',
  'createdat',
  'updatedat',
]);

const ALLOWED_PUBLIC_ROLES = [
  Role.STUDENT,
  Role.INTERVIEWER,
  Role.TEACHER,
];

@Injectable()
export class RegistrationFormsService {
  constructor(
    @InjectModel(RegistrationForm.name)
    private readonly formModel: Model<RegistrationFormDocument>,
  ) {}

  async create(dto: CreateRegistrationFormDto) {
    if (!ALLOWED_PUBLIC_ROLES.includes(dto.targetRole)) {
      throw new BadRequestException(
        `Registration forms cannot be created for privileged role: ${dto.targetRole}`,
      );
    }

    this.validateFieldDefinitions(dto.fields);

    const form = await this.formModel.create({
      ...dto,
      version: 1,
      isPublished: false,
    });

    return {
      message: 'Registration form created successfully',
      data: form,
    };
  }

  async findAll() {
    const forms = await this.formModel
      .find()
      .sort({ createdAt: -1 })
      .lean();

    return {
      count: forms.length,
      data: forms,
    };
  }

  async findOne(id: string) {
    this.validateId(id);

    const form = await this.formModel.findById(id).lean();
    if (!form) {
      throw new NotFoundException('Registration form not found');
    }

    return { data: form };
  }

  async findActiveByRole(targetRole: string) {
    const normalizedRole = targetRole.toUpperCase() as Role;

    if (!ALLOWED_PUBLIC_ROLES.includes(normalizedRole)) {
      throw new ForbiddenException(
        `Public registration is not available for role: ${targetRole}`,
      );
    }

    const form = await this.formModel
      .findOne({
        targetRole: normalizedRole,
        isPublished: true,
      })
      .lean();

    if (!form) {
      throw new NotFoundException(
        `No published registration form found for role: ${normalizedRole}`,
      );
    }

    // Exclude internal-only details before public consumption
    const publicFields = form.fields
      .filter((f) => f.enabled)
      .sort((a, b) => a.order - b.order)
      .map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        helpText: f.helpText,
        options: f.options,
        validation: f.validation,
        order: f.order,
      }));

    return {
      data: {
        id: form._id.toString(),
        title: form.title,
        description: form.description,
        targetRole: form.targetRole,
        version: form.version,
        publishedAt: form.publishedAt,
        fields: publicFields,
      },
    };
  }

  async update(id: string, dto: UpdateRegistrationFormDto) {
    this.validateId(id);

    if (dto.targetRole && !ALLOWED_PUBLIC_ROLES.includes(dto.targetRole)) {
      throw new BadRequestException(
        `Cannot assign form to privileged role: ${dto.targetRole}`,
      );
    }

    if (dto.fields) {
      this.validateFieldDefinitions(dto.fields);
    }

    const form = await this.formModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    );

    if (!form) {
      throw new NotFoundException('Registration form not found');
    }

    return {
      message: 'Registration form updated successfully',
      data: form,
    };
  }

  async publish(id: string) {
    this.validateId(id);

    const form = await this.formModel.findById(id);
    if (!form) {
      throw new NotFoundException('Registration form not found');
    }

    // Unpublish any other form for the same target role
    await this.formModel.updateMany(
      { targetRole: form.targetRole, isPublished: true },
      { $set: { isPublished: false } },
    );

    form.isPublished = true;
    form.publishedAt = new Date();
    await form.save();

    return {
      message: `Registration form for ${form.targetRole} published successfully`,
      data: form,
    };
  }

  async unpublish(id: string) {
    this.validateId(id);

    const form = await this.formModel.findByIdAndUpdate(
      id,
      { $set: { isPublished: false } },
      { new: true },
    );

    if (!form) {
      throw new NotFoundException('Registration form not found');
    }

    return {
      message: 'Registration form unpublished successfully',
      data: form,
    };
  }

  async createVersion(id: string) {
    this.validateId(id);

    const sourceForm = await this.formModel.findById(id);
    if (!sourceForm) {
      throw new NotFoundException('Source registration form not found');
    }

    // Find highest version for this targetRole
    const latestForm = await this.formModel
      .findOne({ targetRole: sourceForm.targetRole })
      .sort({ version: -1 });

    const nextVersion = (latestForm?.version ?? sourceForm.version) + 1;

    const newForm = await this.formModel.create({
      title: `${sourceForm.title} (v${nextVersion})`,
      description: sourceForm.description,
      targetRole: sourceForm.targetRole,
      version: nextVersion,
      isPublished: false,
      fields: sourceForm.fields,
    });

    return {
      message: `Created form version ${nextVersion}`,
      data: newForm,
    };
  }

  /**
   * Validates a submission payload against the currently published form for targetRole.
   */
  async validateSubmission(
    targetRole: Role,
    submittedData: Record<string, any>,
  ): Promise<{
    form: RegistrationFormDocument;
    credentials: { name: string; email: string; password: string };
    profileData: Record<string, any>;
    customFields: Record<string, any>;
  }> {
    if (!ALLOWED_PUBLIC_ROLES.includes(targetRole)) {
      throw new BadRequestException(
        `Registration is not available for role: ${targetRole}`,
      );
    }

    const form = await this.formModel.findOne({
      targetRole,
      isPublished: true,
    });

    if (!form) {
      throw new BadRequestException(
        `Registration for ${targetRole} is currently closed. No active form available.`,
      );
    }

    if (!submittedData || typeof submittedData !== 'object') {
      throw new BadRequestException('Form submission payload must be an object');
    }

    // Security check: reject reserved/privileged keys
    for (const key of Object.keys(submittedData)) {
      if (FORBIDDEN_SUBMISSION_KEYS.has(key.toLowerCase().trim())) {
        throw new BadRequestException(
          `Protected field "${key}" cannot be submitted through dynamic forms`,
        );
      }
    }

    const fieldsByKey = new Map(form.fields.map((f) => [f.key, f]));

    // Validate each enabled field on the published form
    for (const field of form.fields) {
      if (!field.enabled) continue;

      const value = submittedData[field.key];
      const hasValue =
        value !== undefined && value !== null && value !== '';

      if (field.required && !hasValue) {
        throw new BadRequestException(`"${field.label}" is required`);
      }

      if (hasValue) {
        this.validateFieldValue(field, value);
      }
    }

    // Check credentials: name, email, password must be present
    const name = submittedData.name?.toString()?.trim();
    const email = submittedData.email?.toString()?.toLowerCase()?.trim();
    const password = submittedData.password?.toString();

    if (!name || name.length < 2) {
      throw new BadRequestException('Name must be at least 2 characters long');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required');
    }

    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    // Separate profile fields vs custom fields
    const credentials = { name, email, password };
    const profileData: Record<string, any> = {};
    const customFields: Record<string, any> = {};

    const knownProfileKeys = new Set([
      'phone',
      'avatarurl',
      'education',
      'collegeoruniversity',
      'skills',
      'experiencelevel',
      'resumeurl',
      'careergoals',
      'headline',
      'experience',
      'currentdesignation',
      'company',
      'interviewcategories',
      'biography',
      'availabilitypreferences',
      'teachingexperience',
      'expertise',
      'subjects',
      'qualifications',
    ]);

    for (const [key, val] of Object.entries(submittedData)) {
      if (['name', 'email', 'password'].includes(key)) continue;

      if (!fieldsByKey.has(key)) {
        // Unknown field not in published schema
        continue;
      }

      if (knownProfileKeys.has(key.toLowerCase())) {
        profileData[key] = val;
      } else {
        customFields[key] = val;
      }
    }

    return {
      form,
      credentials,
      profileData,
      customFields,
    };
  }

  private validateFieldValue(field: any, value: any) {
    switch (field.type) {
      case FormFieldType.TEXT:
      case FormFieldType.TEXTAREA:
        if (typeof value !== 'string') {
          throw new BadRequestException(`"${field.label}" must be text`);
        }
        if (
          field.validation?.minLength &&
          value.length < field.validation.minLength
        ) {
          throw new BadRequestException(
            `"${field.label}" must be at least ${field.validation.minLength} characters`,
          );
        }
        if (
          field.validation?.maxLength &&
          value.length > field.validation.maxLength
        ) {
          throw new BadRequestException(
            `"${field.label}" cannot exceed ${field.validation.maxLength} characters`,
          );
        }
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            throw new BadRequestException(
              `"${field.label}" format is invalid`,
            );
          }
        }
        break;

      case FormFieldType.EMAIL:
        if (
          typeof value !== 'string' ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          throw new BadRequestException(`"${field.label}" must be a valid email`);
        }
        break;

      case FormFieldType.PASSWORD:
        if (typeof value !== 'string' || value.length < 6) {
          throw new BadRequestException(
            `"${field.label}" must be at least 6 characters`,
          );
        }
        break;

      case FormFieldType.NUMBER: {
        const num = Number(value);
        if (isNaN(num)) {
          throw new BadRequestException(`"${field.label}" must be a number`);
        }
        if (field.validation?.min !== undefined && num < field.validation.min) {
          throw new BadRequestException(
            `"${field.label}" must be at least ${field.validation.min}`,
          );
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          throw new BadRequestException(
            `"${field.label}" cannot exceed ${field.validation.max}`,
          );
        }
        break;
      }

      case FormFieldType.PHONE:
        if (
          typeof value !== 'string' ||
          !/^[+()0-9\s-]{7,25}$/.test(value.trim())
        ) {
          throw new BadRequestException(
            `"${field.label}" must be a valid phone number`,
          );
        }
        break;

      case FormFieldType.SELECT:
      case FormFieldType.RADIO:
        if (!field.options || !field.options.includes(value)) {
          throw new BadRequestException(
            `"${value}" is not an allowed option for "${field.label}"`,
          );
        }
        break;

      case FormFieldType.CHECKBOX:
        if (Array.isArray(value)) {
          for (const item of value) {
            if (field.options?.length && !field.options.includes(item)) {
              throw new BadRequestException(
                `"${item}" is not an allowed option for "${field.label}"`,
              );
            }
          }
        } else if (typeof value !== 'boolean' && typeof value !== 'string') {
          throw new BadRequestException(
            `"${field.label}" must be boolean or allowed option`,
          );
        }
        break;

      case FormFieldType.DATE:
        if (isNaN(Date.parse(value))) {
          throw new BadRequestException(`"${field.label}" must be a valid date`);
        }
        break;

      case FormFieldType.URL:
        if (
          typeof value !== 'string' ||
          !/^https?:\/\/.+$/i.test(value.trim())
        ) {
          throw new BadRequestException(`"${field.label}" must be a valid URL`);
        }
        break;
    }
  }

  private validateFieldDefinitions(fields: any[]) {
    const keys = fields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException('Field keys must be unique within a form');
    }

    for (const field of fields) {
      if (
        [FormFieldType.SELECT, FormFieldType.RADIO].includes(field.type) &&
        (!field.options || field.options.length === 0)
      ) {
        throw new BadRequestException(
          `Field "${field.label}" (${field.key}) of type ${field.type} requires at least one option`,
        );
      }
    }
  }

  private validateId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid registration form ID');
    }
  }
}
