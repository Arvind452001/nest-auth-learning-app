import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { FormFieldType } from '../../common/enums/form-field-type.enum.js';

async function seedSuperAdmin() {
  const adminName = process.env.SEED_ADMIN_NAME?.trim();
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim()?.toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminName || !adminEmail || !adminPassword) {
    const missingVars: string[] = [];
    if (!adminName) missingVars.push('SEED_ADMIN_NAME');
    if (!adminEmail) missingVars.push('SEED_ADMIN_EMAIL');
    if (!adminPassword) missingVars.push('SEED_ADMIN_PASSWORD');
    console.error(
      `❌ Seeding failed: Missing required environment variable(s): ${missingVars.join(
        ', ',
      )}. Never create an admin with hardcoded default credentials!`,
    );
    process.exit(1);
    return;
  }

  if (adminPassword.length < 8) {
    console.error(
      '❌ Seeding failed: SEED_ADMIN_PASSWORD must be at least 8 characters long.',
    );
    process.exit(1);
  }

  const mongoUri =
    process.env.MONGO_URI || 'mongodb://localhost:27017/nest-auth';

  console.log(`Connecting to database: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
  await mongoose.connect(mongoUri);

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const usersCollection = db.collection('users');
    const rolesCollection = db.collection('roles');
    const formsCollection = db.collection('registrationforms');

    // 1. Seed System Roles (Idempotent)
    const systemRoles = [
      {
        name: Role.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full unrestricted platform access',
        permissions: ['*'],
        isActive: true,
        isPublicRegistration: false,
        isSystem: true,
      },
      {
        name: Role.ADMIN,
        displayName: 'Administrator',
        description: 'Platform management and moderation',
        permissions: ['manage:users', 'manage:forms', 'verify:profiles'],
        isActive: true,
        isPublicRegistration: false,
        isSystem: true,
      },
      {
        name: Role.STUDENT,
        displayName: 'Student',
        description: 'Learners and mock interview candidates',
        permissions: ['book:interview', 'view:tutorials'],
        isActive: true,
        isPublicRegistration: true,
        isSystem: false,
      },
      {
        name: Role.INTERVIEWER,
        displayName: 'Interviewer',
        description: 'Industry experts taking mock interviews',
        permissions: ['conduct:interview', 'submit:feedback'],
        isActive: true,
        isPublicRegistration: true,
        isSystem: false,
      },
      {
        name: Role.TEACHER,
        displayName: 'Teacher',
        description: 'Instructors providing live teaching and courses',
        permissions: ['create:course', 'host:live_class'],
        isActive: true,
        isPublicRegistration: true,
        isSystem: false,
      },
    ];

    for (const r of systemRoles) {
      await rolesCollection.updateOne(
        { name: r.name },
        { $setOnInsert: { ...r, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true },
      );
    }
    console.log('✅ System roles verified and seeded.');

    // 2. Seed / Update Super Admin User (Idempotent)
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(
        `ℹ️ User with email "${adminEmail}" already exists. Ensuring SUPER_ADMIN role...`,
      );
      const roles: string[] = existingAdmin.roles ?? [];
      const updatedRoles = Array.from(
        new Set([...roles, Role.SUPER_ADMIN, Role.ADMIN]),
      );

      await usersCollection.updateOne(
        { _id: existingAdmin._id },
        {
          $set: {
            roles: updatedRoles,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            updatedAt: new Date(),
          },
        },
      );
      console.log(
        `✅ Existing user "${adminEmail}" updated with SUPER_ADMIN privileges.`,
      );
    } else {
      const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
      const newAdmin = {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await usersCollection.insertOne(newAdmin);
      console.log(
        `✅ Super Admin account created successfully for: ${adminEmail}`,
      );
    }

    // 3. Seed Default Published Registration Forms (Idempotent)
    // Student Form
    const studentFormCount = await formsCollection.countDocuments({
      targetRole: Role.STUDENT,
    });
    if (studentFormCount === 0) {
      await formsCollection.insertOne({
        title: 'Student Onboarding Form',
        description: 'Standard registration form for student candidates',
        targetRole: Role.STUDENT,
        version: 1,
        isPublished: true,
        publishedAt: new Date(),
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: FormFieldType.TEXT,
            required: true,
            placeholder: 'e.g. John Doe',
            helpText: '',
            options: [],
            order: 1,
            enabled: true,
          },
          {
            key: 'email',
            label: 'Email Address',
            type: FormFieldType.EMAIL,
            required: true,
            placeholder: 'john@example.com',
            helpText: 'Official or personal email',
            options: [],
            order: 2,
            enabled: true,
          },
          {
            key: 'password',
            label: 'Password',
            type: FormFieldType.PASSWORD,
            required: true,
            placeholder: '••••••••',
            helpText: 'Minimum 6 characters',
            options: [],
            order: 3,
            enabled: true,
          },
          {
            key: 'phone',
            label: 'Phone Number',
            type: FormFieldType.PHONE,
            required: false,
            placeholder: '+1 234 567 8900',
            helpText: 'For interview reminders',
            options: [],
            order: 4,
            enabled: true,
          },
          {
            key: 'collegeOrUniversity',
            label: 'College or University',
            type: FormFieldType.TEXT,
            required: false,
            placeholder: 'Stanford University',
            helpText: '',
            options: [],
            order: 5,
            enabled: true,
          },
          {
            key: 'experienceLevel',
            label: 'Experience Level',
            type: FormFieldType.SELECT,
            required: false,
            placeholder: '',
            helpText: 'Current skill level',
            options: ['Beginner', 'Intermediate', 'Advanced'],
            order: 6,
            enabled: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Default Student Registration Form published.');
    }

    // Interviewer Form
    const interviewerFormCount = await formsCollection.countDocuments({
      targetRole: Role.INTERVIEWER,
    });
    if (interviewerFormCount === 0) {
      await formsCollection.insertOne({
        title: 'Interviewer Application Form',
        description: 'Application form for mock interviewers',
        targetRole: Role.INTERVIEWER,
        version: 1,
        isPublished: true,
        publishedAt: new Date(),
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: FormFieldType.TEXT,
            required: true,
            placeholder: 'e.g. Jane Smith',
            helpText: '',
            options: [],
            order: 1,
            enabled: true,
          },
          {
            key: 'email',
            label: 'Email Address',
            type: FormFieldType.EMAIL,
            required: true,
            placeholder: 'jane@company.com',
            helpText: 'Corporate or primary email',
            options: [],
            order: 2,
            enabled: true,
          },
          {
            key: 'password',
            label: 'Password',
            type: FormFieldType.PASSWORD,
            required: true,
            placeholder: '••••••••',
            helpText: 'Minimum 6 characters',
            options: [],
            order: 3,
            enabled: true,
          },
          {
            key: 'company',
            label: 'Current Company',
            type: FormFieldType.TEXT,
            required: true,
            placeholder: 'e.g. Google, Amazon, Microsoft',
            helpText: '',
            options: [],
            order: 4,
            enabled: true,
          },
          {
            key: 'currentDesignation',
            label: 'Current Role / Designation',
            type: FormFieldType.TEXT,
            required: true,
            placeholder: 'Senior Software Engineer',
            helpText: '',
            options: [],
            order: 5,
            enabled: true,
          },
          {
            key: 'experience',
            label: 'Total Experience (Years)',
            type: FormFieldType.NUMBER,
            required: false,
            placeholder: '5',
            helpText: 'Years of professional industry experience',
            options: [],
            order: 6,
            enabled: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Default Interviewer Registration Form published.');
    }

    // Teacher Form
    const teacherFormCount = await formsCollection.countDocuments({
      targetRole: Role.TEACHER,
    });
    if (teacherFormCount === 0) {
      await formsCollection.insertOne({
        title: 'Teacher Application Form',
        description: 'Application form for course educators and instructors',
        targetRole: Role.TEACHER,
        version: 1,
        isPublished: true,
        publishedAt: new Date(),
        fields: [
          {
            key: 'name',
            label: 'Full Name',
            type: FormFieldType.TEXT,
            required: true,
            placeholder: 'Dr. Alan Turing',
            helpText: '',
            options: [],
            order: 1,
            enabled: true,
          },
          {
            key: 'email',
            label: 'Email Address',
            type: FormFieldType.EMAIL,
            required: true,
            placeholder: 'alan@university.edu',
            helpText: '',
            options: [],
            order: 2,
            enabled: true,
          },
          {
            key: 'password',
            label: 'Password',
            type: FormFieldType.PASSWORD,
            required: true,
            placeholder: '••••••••',
            helpText: 'Minimum 6 characters',
            options: [],
            order: 3,
            enabled: true,
          },
          {
            key: 'teachingExperience',
            label: 'Teaching Experience',
            type: FormFieldType.TEXT,
            required: true,
            placeholder: '8 years university lecturer',
            helpText: '',
            options: [],
            order: 4,
            enabled: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Default Teacher Registration Form published.');
    }

    console.log('🎉 Seeding completed successfully.');
  } finally {
    await mongoose.disconnect();
  }
}

seedSuperAdmin().catch((err) => {
  console.error('❌ Seeding process error:', err);
  process.exit(1);
});
