import nodemailer from 'nodemailer';
import { assertMailConfigured, env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

type EmailContent = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type RegisterOtpEmailInput = {
  to: string;
  name: string;
  code: string;
};

type FileShareEmailInput = {
  to: string;
  recipientName: string;
  senderName: string;
  fileName: string;
  fileId: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRegisterOtpEmailContent(input: RegisterOtpEmailInput): EmailContent {
  const expiresInMinutes: number = Math.floor(env.loginOtpTtlSeconds / 60);
  const safeName: string = escapeHtml(input.name);
  return {
    to: input.to,
    subject: 'Confirm your Vaultly account',
    text: `Hi ${input.name},\n\nYour Vaultly confirmation code is ${input.code}.\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not create an account, you can ignore this email.`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Your Vaultly confirmation code is:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;">${escapeHtml(input.code)}</p>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  };
}

function buildFileShareEmailContent(input: FileShareEmailInput): EmailContent {
  const shareUrl: string = `${env.appUrl}/share/${encodeURIComponent(input.fileId)}`;
  const safeRecipient: string = escapeHtml(input.recipientName);
  const safeSender: string = escapeHtml(input.senderName);
  const safeFileName: string = escapeHtml(input.fileName);
  return {
    to: input.to,
    subject: `${input.senderName} shared “${input.fileName}” with you on Vaultly`,
    text: `Hi ${input.recipientName},\n\n${input.senderName} shared “${input.fileName}” with you on Vaultly.\n\nOpen it here: ${shareUrl}\n\nYou can also find it under Shared with me after you sign in.`,
    html: `
      <p>Hi ${safeRecipient},</p>
      <p><strong>${safeSender}</strong> shared <strong>${safeFileName}</strong> with you on Vaultly.</p>
      <p><a href="${shareUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">Open file</a></p>
      <p>You can also find it under Shared with me after you sign in.</p>
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

async function sendEmailViaResend(content: EmailContent): Promise<void> {
  const response: Response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to: [content.to],
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

async function sendEmailViaSmtp(content: EmailContent): Promise<void> {
  const mailer: nodemailer.Transporter = getSmtpTransporter();
  await mailer.sendMail({
    from: env.mailFrom,
    to: content.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}

async function sendEmail(content: EmailContent): Promise<void> {
  assertMailConfigured();
  if (env.resendApiKey) {
    await sendEmailViaResend(content);
    return;
  }
  await sendEmailViaSmtp(content);
}

export async function sendRegisterOtpEmail(input: RegisterOtpEmailInput): Promise<void> {
  await sendEmail(buildRegisterOtpEmailContent(input));
}

export async function sendFileShareEmail(input: FileShareEmailInput): Promise<void> {
  await sendEmail(buildFileShareEmailContent(input));
}
