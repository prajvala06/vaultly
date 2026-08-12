import nodemailer from 'nodemailer';
import { assertSmtpConfigured, env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  assertSmtpConfigured();
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return transporter;
}

export async function sendRegisterOtpEmail(input: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const mailer: nodemailer.Transporter = getTransporter();
  const expiresInMinutes: number = Math.floor(env.loginOtpTtlSeconds / 60);
  await mailer.sendMail({
    from: env.smtpFrom,
    to: input.to,
    subject: 'Confirm your Vaultly account',
    text: `Hi ${input.name},\n\nYour Vaultly confirmation code is ${input.code}.\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not create an account, you can ignore this email.`,
    html: `
      <p>Hi ${input.name},</p>
      <p>Your Vaultly confirmation code is:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;">${input.code}</p>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  });
}
