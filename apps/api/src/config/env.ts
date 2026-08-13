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

function readPositiveInt(name: string, fallback: number): number {
  const raw: string | undefined = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed: number = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `Invalid ${name}="${raw}". Expected a positive number of seconds/bytes. Using ${fallback}.`,
    );
    return fallback;
  }
  return Math.floor(parsed);
}

const cookieSecure: boolean = readOptional('COOKIE_SECURE', 'false') === 'true';
const cookieSameSiteRaw: string = readOptional('COOKIE_SAME_SITE', cookieSecure ? 'none' : 'lax');
const cookieSameSite: 'lax' | 'none' | 'strict' =
  cookieSameSiteRaw === 'none' || cookieSameSiteRaw === 'strict' ? cookieSameSiteRaw : 'lax';
const corsOrigin: string = readOptional('CORS_ORIGIN', 'http://localhost:3000');

export const env = {
  nodeEnv: readOptional('NODE_ENV', 'development'),
  apiHost: readOptional('API_HOST', '0.0.0.0'),
  apiPort: readPositiveInt('PORT', readPositiveInt('API_PORT', 4000)),
  corsOrigin,
  appUrl: normalizeOrigin(
    readOptional('APP_URL', parseCorsOrigins(corsOrigin)[0] ?? 'https://vaultly-store.vercel.app'),
  ),
  jwtAccessSecret: readOptional('JWT_ACCESS_SECRET', 'dev-only-change-me-to-a-long-random-secret'),
  accessTokenTtlSeconds: readPositiveInt('ACCESS_TOKEN_TTL_SECONDS', 900),
  cookieName: readOptional('COOKIE_NAME', 'vaultly_access_token'),
  cookieSecure,
  cookieSameSite,
  resendApiKey: process.env.RESEND_API_KEY?.trim() ?? '',
  smtpHost: readOptional('SMTP_HOST', 'smtp.gmail.com'),
  smtpPort: readPositiveInt('SMTP_PORT', 587),
  smtpUser: process.env.SMTP_USER?.trim() ?? '',
  smtpPass: process.env.SMTP_PASS?.trim() ?? '',
  mailFrom: readOptional(
    'MAIL_FROM',
    readOptional('SMTP_FROM', process.env.SMTP_USER?.trim() ?? 'Vaultly <onboarding@resend.dev>'),
  ),
  loginOtpTtlSeconds: readPositiveInt(
    'REGISTER_OTP_TTL_SECONDS',
    readPositiveInt('LOGIN_OTP_TTL_SECONDS', 600),
  ),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim() ?? '',
  cloudinaryFolder: readOptional('CLOUDINARY_FOLDER', 'vaultly'),
  maxFileSizeBytes: readPositiveInt('MAX_FILE_SIZE_BYTES', 104857600),
  storageQuotaBytes: readPositiveInt('STORAGE_QUOTA_BYTES', 1 * 1024 * 1024 * 1024),
};

export function isMailConfigured(): boolean {
  if (env.resendApiKey) {
    return true;
  }
  return Boolean(env.smtpUser && env.smtpPass);
}

export function assertMailConfigured(): void {
  if (isMailConfigured()) {
    return;
  }
  throw new Error(
    'Configure RESEND_API_KEY for production email, or SMTP_USER and SMTP_PASS for local SMTP.',
  );
}

export function assertCloudinaryConfigured(): void {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new Error(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured.',
    );
  }
}

export function normalizeOrigin(origin: string): string {
  return origin
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\/+$/, '');
}

export function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin) => origin.length > 0);
}

export function isAllowedCorsOrigin(origin: string, allowedOrigins: readonly string[]): boolean {
  const normalizedOrigin: string = normalizeOrigin(origin);
  return allowedOrigins.some((allowedOrigin) => allowedOrigin === normalizedOrigin);
}
