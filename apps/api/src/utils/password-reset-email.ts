import { env } from "@basango/domain/config";
import { logger } from "@basango/logger";

type PasswordResetEmail = {
  email: string;
  name: string;
  token: string;
  url: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "'": "&#039;",
      '"': "&quot;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
    };
    return entities[character] ?? character;
  });
}

export async function sendPasswordResetEmail(input: PasswordResetEmail): Promise<void> {
  const apiKey = env.BASANGO_RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (env.NODE_ENV === "prod") {
      throw new Error("BASANGO_RESEND_API_KEY is required to send password reset emails.");
    }

    logger.info(
      { email: input.email, resetUrl: input.url },
      "Password reset email delivery is disabled; use this development reset URL",
    );
    return;
  }

  const safeName = escapeHtml(input.name);
  const safeResetUrl = escapeHtml(input.url);
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: env.BASANGO_RESEND_FROM_EMAIL ?? "Basango <noreply@basango.ngandu.dev>",
      html: `<p>Hello ${safeName},</p><p>Use the link below to reset your Basango password. This link expires in 30 minutes and can only be used once.</p><p><a href="${safeResetUrl}">Reset your password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
      subject: "Reset your Basango password",
      text: `Hello ${input.name},\n\nReset your Basango password using this link:\n${input.url}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, you can safely ignore this email.`,
      to: [input.email],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `password-reset/${input.token}`,
    },
    method: "POST",
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Password reset email delivery failed (${response.status}): ${responseBody}`);
  }
}
