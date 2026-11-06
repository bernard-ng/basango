import { sendEmail } from "./email";

type PasswordResetEmail = {
  email: string;
  name: string;
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
  const safeName = escapeHtml(input.name);
  const safeResetUrl = escapeHtml(input.url);

  await sendEmail({
    html: `<p>Hello ${safeName},</p><p>Use the link below to reset your Basango password. This link expires in 30 minutes and can only be used once.</p><p><a href="${safeResetUrl}">Reset your password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
    subject: "Reset your Basango password",
    text: `Hello ${input.name},\n\nReset your Basango password using this link:\n${input.url}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, you can safely ignore this email.`,
    to: input.email,
  });
}
