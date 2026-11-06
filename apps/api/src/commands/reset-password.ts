#!/usr/bin/env bun

import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { parseArgs } from "node:util";

import { passwordSchema, requestPasswordResetSchema } from "@basango/domain/models";

import { resetUserPassword } from "./reset-user-password";

const HELP = `Usage: bun run auth:reset-password --email <email> [--password-stdin]

Reset an existing user's password and revoke their sessions without sending email.
By default, prompts for a hidden password and confirmation (8–72 characters).
Use --password-stdin to read the password from standard input instead.
Uses the API's repository-root environment configuration and database.`;

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      email: { type: "string" },
      help: { short: "h", type: "boolean" },
      "password-stdin": { type: "boolean" },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(`${HELP}\n`);
    return;
  }

  const email = requestPasswordResetSchema.shape.email.safeParse(values.email);

  if (!email.success) {
    throw new Error("Provide a valid email with --email <email>. Use --help for usage.");
  }

  const newPassword = await readPassword(values["password-stdin"] ?? false);
  const validation = passwordSchema.safeParse(newPassword);

  if (!validation.success) {
    throw new Error(validation.error.issues.map((issue) => issue.message).join("; "));
  }

  const { auth } = await import("#api/auth");
  const userEmail = await resetUserPassword(auth, email.data, newPassword);

  process.stdout.write(`Password reset for ${userEmail}. Existing sessions revoked.\n`);
}

async function readPassword(fromStdin: boolean): Promise<string> {
  if (fromStdin) {
    // Strip one line ending from a pipe while preserving intentional password whitespace.
    return (await Bun.stdin.text()).replace(/\r?\n$/, "");
  }

  if (!process.stdin.isTTY) {
    throw new Error("Use --password-stdin when running without an interactive terminal.");
  }

  const newPassword = await promptForHiddenInput("New password: ");
  const confirmation = await promptForHiddenInput("Confirm password: ");

  if (newPassword !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  return newPassword;
}

async function promptForHiddenInput(message: string): Promise<string> {
  let isMuted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!isMuted) {
        process.stdout.write(chunk);
      }

      callback();
    },
  });
  const input = createInterface({ input: process.stdin, output, terminal: true });

  try {
    const answer = input.question(message);

    isMuted = true;
    const value = await answer;

    process.stdout.write("\n");
    return value;
  } finally {
    input.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Password reset failed.";

  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
