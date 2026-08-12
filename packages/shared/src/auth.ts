import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8 as const;
export const REGISTER_OTP_LENGTH = 4 as const;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must include at least one number.');

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(80, 'Name must be at most 80 characters.'),
    email: z.email('Enter a valid email address.'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  });

export const verifyRegisterOtpSchema = z.object({
  email: z.email('Enter a valid email address.'),
  code: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${REGISTER_OTP_LENGTH}}$`),
      `Enter the ${REGISTER_OTP_LENGTH}-digit code.`,
    ),
});

export const resendRegisterOtpSchema = z.object({
  email: z.email('Enter a valid email address.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyRegisterOtpInput = z.infer<typeof verifyRegisterOtpSchema>;
export type ResendRegisterOtpInput = z.infer<typeof resendRegisterOtpSchema>;

export const PASSWORD_REQUIREMENTS: readonly string[] = [
  `At least ${PASSWORD_MIN_LENGTH} characters`,
  'One uppercase letter',
  'One lowercase letter',
  'One number',
] as const;
