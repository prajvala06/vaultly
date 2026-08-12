import { REGISTER_OTP_LENGTH } from '@vaultly/shared';
import { env } from '../config/env.js';

export type RegisterOtpRecord = {
  readonly code: string;
  readonly expiresAt: number;
  readonly userId: string;
};

const otpByEmail = new Map<string, RegisterOtpRecord>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateRegisterOtpCode(): string {
  const max: number = 10 ** REGISTER_OTP_LENGTH;
  const value: number = Math.floor(Math.random() * max);
  return value.toString().padStart(REGISTER_OTP_LENGTH, '0');
}

export function saveRegisterOtp(input: {
  email: string;
  userId: string;
  code: string;
}): RegisterOtpRecord {
  const record: RegisterOtpRecord = {
    code: input.code,
    userId: input.userId,
    expiresAt: Date.now() + env.loginOtpTtlSeconds * 1000,
  };
  otpByEmail.set(normalizeEmail(input.email), record);
  return record;
}

export function consumeRegisterOtp(email: string, code: string): RegisterOtpRecord | null {
  const key: string = normalizeEmail(email);
  const record: RegisterOtpRecord | undefined = otpByEmail.get(key);
  if (!record) {
    return null;
  }
  if (Date.now() > record.expiresAt) {
    otpByEmail.delete(key);
    return null;
  }
  if (record.code !== code.trim()) {
    return null;
  }
  otpByEmail.delete(key);
  return record;
}

export function clearRegisterOtp(email: string): void {
  otpByEmail.delete(normalizeEmail(email));
}
