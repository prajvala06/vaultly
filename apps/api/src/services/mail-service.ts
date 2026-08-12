import nodemailer from 'nodemailer';
import { assertMailConfigured, env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

type RegisterOtpEmailInput = {
  to: string;
  name: string;
  code: string;
};

function buildRegisterOtpEmailContent(input: RegisterOtpEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const expiresInMinutes: number = Math.floor(env.loginOtpTtlSeconds / 60);
  return {
    subject: 'Confirm your Vaultly account',
    text: `Hi ${input.name},\n\nYour Vaultly confirmation code is ${input.code}.\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not create an account, you can ignore this email.`,
    html: `
      <p>Hi ${input.name},</p>
      <p>Your Vaultly confirmation code is:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;">${input.code}</p>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  };
}

function getSmtpTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

async function sendRegisterOtpEmailViaResend(input: RegisterOtpEmailInput): Promise<void> {
  const content = buildRegisterOtpEmailContent(input);
  const response: Response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to: [input.to],
      subject: content.subject,
      text: content.text,
      html: content.html,
    }),
  });
  if (response.ok) {
    return;
  }
  let errorMessage: string = `Resend request failed with status ${response.status}.`;
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      errorMessage = body.message;
    }
  } catch {
    // Keep generic message when response is not JSON.
  }
  throw new Error(errorMessage);
}

async function sendRegisterOtpEmailViaSmtp(input: RegisterOtpEmailInput): Promise<void> {
  const mailer: nodemailer.Transporter = getSmtpTransporter();
  const content = buildRegisterOtpEmailContent(input);
  await mailer.sendMail({
    from: env.mailFrom,
    to: input.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}

export async function sendRegisterOtpEmail(input: RegisterOtpEmailInput): Promise<void> {
  assertMailConfigured();
  if (env.resendApiKey) {
    await sendRegisterOtpEmailViaResend(input);
    return;
  }
  await sendRegisterOtpEmailViaSmtp(input);
}
