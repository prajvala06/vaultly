import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import {
  loginSchema,
  registerSchema,
  resendRegisterOtpSchema,
  verifyRegisterOtpSchema,
  type LoginInput,
  type RegisterInput,
  type ResendRegisterOtpInput,
  type VerifyRegisterOtpInput,
} from '@vaultly/shared';
import { HttpError } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { sendRegisterOtpEmail } from './mail-service.js';
import {
  consumeRegisterOtp,
  generateRegisterOtpCode,
  saveRegisterOtp,
} from '../stores/otp-store.js';
import { signAccessToken, type AccessTokenPayload } from './token-service.js';

const BCRYPT_ROUNDS = 10;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export type RegisterChallengeResult = {
  email: string;
  message: string;
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
};

export type VerifyOtpResult = {
  user: PublicUser;
  accessToken: string;
};

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function createAccessToken(user: User): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
  };
  return signAccessToken(payload);
}

async function issueRegisterOtp(user: User): Promise<RegisterChallengeResult> {
  const code: string = generateRegisterOtpCode();
  saveRegisterOtp({ email: user.email, userId: user.id, code });
  try {
    await sendRegisterOtpEmail({ to: user.email, name: user.name, code });
  } catch (error) {
    console.error('Failed to send register OTP email', error);
    throw new HttpError(
      502,
      'EMAIL_SEND_FAILED',
      'Could not send the confirmation code. Check SMTP settings.',
    );
  }
  return {
    email: user.email,
    message: 'A 4-digit confirmation code was sent to your email.',
  };
}

export async function startRegister(rawInput: unknown): Promise<RegisterChallengeResult> {
  const parsed: RegisterInput = registerSchema.parse(rawInput);
  const email: string = parsed.email.trim().toLowerCase();
  const existing: User | null = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  }
  const passwordHash: string = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS);
  const user: User = existing
    ? await prisma.user.update({
        where: { email },
        data: {
          name: parsed.name.trim(),
          passwordHash,
        },
      })
    : await prisma.user.create({
        data: {
          name: parsed.name.trim(),
          email,
          passwordHash,
        },
      });
  return issueRegisterOtp(user);
}

export async function resendRegisterOtp(rawInput: unknown): Promise<RegisterChallengeResult> {
  const parsed: ResendRegisterOtpInput = resendRegisterOtpSchema.parse(rawInput);
  const email: string = parsed.email.trim().toLowerCase();
  const user: User | null = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'No pending registration found for this email.');
  }
  if (user.emailVerifiedAt) {
    throw new HttpError(400, 'ALREADY_VERIFIED', 'This account is already verified. Please sign in.');
  }
  return issueRegisterOtp(user);
}

export async function verifyRegisterOtp(rawInput: unknown): Promise<VerifyOtpResult> {
  const parsed: VerifyRegisterOtpInput = verifyRegisterOtpSchema.parse(rawInput);
  const email: string = parsed.email.trim().toLowerCase();
  const record = consumeRegisterOtp(email, parsed.code);
  if (!record) {
    throw new HttpError(401, 'INVALID_OTP', 'Invalid or expired confirmation code.');
  }
  const user: User | null = await prisma.user.findUnique({ where: { email } });
  if (!user || user.id !== record.userId) {
    throw new HttpError(401, 'INVALID_OTP', 'Invalid or expired confirmation code.');
  }
  const verifiedUser: User = user.emailVerifiedAt
    ? user
    : await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
  return {
    user: toPublicUser(verifiedUser),
    accessToken: createAccessToken(verifiedUser),
  };
}

export async function loginUser(rawInput: unknown): Promise<LoginResult> {
  const parsed: LoginInput = loginSchema.parse(rawInput);
  const email: string = parsed.email.trim().toLowerCase();
  const user: User | null = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  const isPasswordValid: boolean = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  if (!user.emailVerifiedAt) {
    throw new HttpError(
      403,
      'EMAIL_NOT_VERIFIED',
      'Please confirm your email with the 4-digit code before signing in.',
    );
  }
  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user),
  };
}
