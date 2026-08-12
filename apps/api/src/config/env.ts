import path from 'node:path';
import dotenv from 'dotenv';

const candidateEnvPaths: string[] = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of candidateEnvPaths) {
  dotenv.config({ path: envPath });
}

function readOptional(name: string, fallback: string): string {
  const value: string | undefined = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  nodeEnv: readOptional('NODE_ENV', 'development'),
  apiPort: Number(readOptional('API_PORT', '4000')),
  corsOrigin: readOptional('CORS_ORIGIN', 'http://localhost:3000'),
  jwtAccessSecret: readOptional('JWT_ACCESS_SECRET', 'dev-only-change-me-to-a-long-random-secret'),
  accessTokenTtlSeconds: Number(readOptional('ACCESS_TOKEN_TTL_SECONDS', '900')),
  cookieName: readOptional('COOKIE_NAME', 'vaultly_access_token'),
  cookieSecure: readOptional('COOKIE_SECURE', 'false') === 'true',
  smtpHost: readOptional('SMTP_HOST', 'smtp.gmail.com'),
  smtpPort: Number(readOptional('SMTP_PORT', '587')),
  smtpUser: process.env.SMTP_USER?.trim() ?? '',
  smtpPass: process.env.SMTP_PASS?.trim() ?? '',
  smtpFrom: readOptional('SMTP_FROM', process.env.SMTP_USER?.trim() ?? 'Vaultly <noreply@vaultly.app>'),
  loginOtpTtlSeconds: Number(
    readOptional('REGISTER_OTP_TTL_SECONDS', readOptional('LOGIN_OTP_TTL_SECONDS', '600')),
  ),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim() ?? '',
  cloudinaryFolder: readOptional('CLOUDINARY_FOLDER', 'vaultly'),
  maxFileSizeBytes: Number(readOptional('MAX_FILE_SIZE_BYTES', '104857600')),
  storageQuotaBytes: Number(readOptional('STORAGE_QUOTA_BYTES', String(1 * 1024 * 1024 * 1024))),
};

export function assertSmtpConfigured(): void {
  if (!env.smtpUser || !env.smtpPass) {
    throw new Error('SMTP_USER and SMTP_PASS must be configured to send login codes.');
  }
}

export function assertCloudinaryConfigured(): void {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new Error(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured.',
    );
  }
}
