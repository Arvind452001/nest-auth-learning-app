export interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: string;
  MONGO_URI: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  BCRYPT_SALT_ROUNDS: number;
  OTP_EXPIRES_IN_MINUTES: number;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
}

export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  const isTest = config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test';

  if (!isTest) {
    const requiredVars = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = requiredVars.filter((key) => !config[key]);

    if (missing.length > 0) {
      throw new Error(
        `[ConfigValidation] Missing required environment variable(s): ${missing.join(', ')}. Please check your .env file.`,
      );
    }
  }

  return {
    ...config,
    PORT: Number(config.PORT) || 3030,
    NODE_ENV: config.NODE_ENV || 'development',
    JWT_ACCESS_EXPIRES_IN: config.JWT_ACCESS_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: config.JWT_REFRESH_EXPIRES_IN || '7d',
    BCRYPT_SALT_ROUNDS: Number(config.BCRYPT_SALT_ROUNDS) || 10,
    OTP_EXPIRES_IN_MINUTES: Number(config.OTP_EXPIRES_IN_MINUTES) || 10,
    CLOUDINARY_CLOUD_NAME: config.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: config.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: config.CLOUDINARY_API_SECRET || '',
    SMTP_HOST: config.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: Number(config.SMTP_PORT) || 587,
    SMTP_USER: config.SMTP_USER || '',
    SMTP_PASS: config.SMTP_PASS || '',
    SMTP_FROM: config.SMTP_FROM || '',
  };
}
