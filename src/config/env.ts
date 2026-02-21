import dotenv from 'dotenv';

dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me-in-production',
};

if (
  env.NODE_ENV === 'production' &&
  env.JWT_SECRET === 'dev-secret-change-me-in-production'
) {
  throw new Error(
    "JWT_SECRET must be set to a strong, non-default value in production. Current value uses the insecure default 'dev-secret-change-me-in-production'.",
  );
}
