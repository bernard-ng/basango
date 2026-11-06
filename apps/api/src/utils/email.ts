import { env } from "@basango/domain/config";
import nodemailer from "nodemailer";

type Email = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

const smtpUser = env.BASANGO_SMTP_USER?.trim();
const smtpPassword = env.BASANGO_SMTP_PASSWORD;

if (Boolean(smtpUser) !== Boolean(smtpPassword)) {
  throw new Error("BASANGO_SMTP_USER and BASANGO_SMTP_PASSWORD must be configured together.");
}

const emailTransport = nodemailer.createTransport({
  auth:
    smtpUser && smtpPassword
      ? {
          pass: smtpPassword,
          user: smtpUser,
        }
      : undefined,
  host: env.BASANGO_SMTP_HOST,
  port: env.BASANGO_SMTP_PORT,
  secure: env.BASANGO_SMTP_SECURE,
});

export async function sendEmail(input: Email): Promise<void> {
  await emailTransport.sendMail({
    from: env.BASANGO_SMTP_FROM_EMAIL,
    html: input.html,
    subject: input.subject,
    text: input.text,
    to: input.to,
  });
}
