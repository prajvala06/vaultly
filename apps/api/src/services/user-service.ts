import type { UserLookupResponse } from '@vaultly/shared';
import { HttpError } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';

const EMAIL_PATTERN: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function lookupUserByEmail(input: {
  email: string;
}): Promise<UserLookupResponse> {
  const normalizedEmail: string = input.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new HttpError(400, 'INVALID_EMAIL', 'Enter a complete email address.');
  }
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  return { user };
}
