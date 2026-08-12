import { createHash, timingSafeEqual } from 'node:crypto';
import { REGISTER_OTP_LENGTH } from '@vaultly/shared';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export type RegisterOtpRecord = {
  readonly code: string;
  readonly expiresAt: number;
  readonly userId: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashOtpCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

function isMatchingOtpHash(code: string, storedHash: string): boolean {
  const incoming: Buffer = Buffer.from(hashOtpCode(code), 'utf8');
  const stored: Buffer = Buffer.from(storedHash, 'utf8');
  if (incoming.length !== stored.length) {
    return false;
  }
  return timingSafeEqual(incoming, stored);
}

export function generateRegisterOtpCode(): string {
  const max: number = 10 ** REGISTER_OTP_LENGTH;
  const value: number = Math.floor(Math.random() * max);
  return value.toString().padStart(REGISTER_OTP_LENGTH, '0');
}

export async function saveRegisterOtp(input: {
  email: string;
  userId: string;
  code: string;
}): Promise<RegisterOtpRecord> {
  const expiresAt: Date = new Date(Date.now() + env.loginOtpTtlSeconds * 1000);
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      registerOtpHash: hashOtpCode(input.code),
      registerOtpExpiresAt: expiresAt,
    },
  });
  return {
    code: input.code,
    userId: input.userId,
    expiresAt: expiresAt.getTime(),
  };
}

export async function consumeRegisterOtp(
  email: string,
  code: string,
): Promise<RegisterOtpRecord | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: {
      id: true,
      registerOtpHash: true,
      registerOtpExpiresAt: true,
    },
  });
  if (!user?.registerOtpHash || !user.registerOtpExpiresAt) {
    return null;
  }
  if (Date.now() > user.registerOtpExpiresAt.getTime()) {
    await clearRegisterOtp(user.id);
    return null;
  }
  if (!isMatchingOtpHash(code, user.registerOtpHash)) {
    return null;
  }
  await clearRegisterOtp(user.id);
  return {
    code: code.trim(),
    userId: user.id,
    expiresAt: user.registerOtpExpiresAt.getTime(),
  };
}

export async function clearRegisterOtp(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      registerOtpHash: null,
      registerOtpExpiresAt: null,
    },
  });
}
