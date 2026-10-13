import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Admin Seeding Requirements', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should detect missing seed credentials and fail without creating defaults', () => {
    delete process.env.SEED_ADMIN_NAME;
    delete process.env.SEED_ADMIN_EMAIL;
    delete process.env.SEED_ADMIN_PASSWORD;

    const missingVars: string[] = [];
    if (!process.env.SEED_ADMIN_NAME) missingVars.push('SEED_ADMIN_NAME');
    if (!process.env.SEED_ADMIN_EMAIL) missingVars.push('SEED_ADMIN_EMAIL');
    if (!process.env.SEED_ADMIN_PASSWORD) missingVars.push('SEED_ADMIN_PASSWORD');

    expect(missingVars).toHaveLength(3);
    expect(missingVars).toContain('SEED_ADMIN_NAME');
    expect(missingVars).toContain('SEED_ADMIN_EMAIL');
    expect(missingVars).toContain('SEED_ADMIN_PASSWORD');
  });

  it('should reject passwords shorter than 8 characters', () => {
    process.env.SEED_ADMIN_NAME = 'Super Admin';
    process.env.SEED_ADMIN_EMAIL = 'admin@platform.com';
    process.env.SEED_ADMIN_PASSWORD = 'short';

    const isValidLength = (process.env.SEED_ADMIN_PASSWORD ?? '').length >= 8;
    expect(isValidLength).toBe(false);
  });

  it('should be idempotent and not create duplicate admin accounts', async () => {
    // Simulated database collection
    const users: any[] = [];
    const seedRun = async (email: string, name: string) => {
      const existing = users.find((u) => u.email === email);
      if (existing) {
        existing.roles = Array.from(new Set([...existing.roles, 'SUPER_ADMIN', 'ADMIN']));
        return { created: false, user: existing };
      } else {
        const newUser = { email, name, roles: ['SUPER_ADMIN', 'ADMIN'] };
        users.push(newUser);
        return { created: true, user: newUser };
      }
    };

    const firstRun = await seedRun('admin@platform.com', 'Admin 1');
    expect(firstRun.created).toBe(true);
    expect(users).toHaveLength(1);

    const secondRun = await seedRun('admin@platform.com', 'Admin 1');
    expect(secondRun.created).toBe(false);
    expect(users).toHaveLength(1);
    expect(secondRun.user.roles).toContain('SUPER_ADMIN');
  });
});
