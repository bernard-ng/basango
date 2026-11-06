# Reset a user's password

From the repository root, run:

```bash
bun run auth:reset-password --email user@example.com
```

Enter the new password and confirmation at the hidden prompts. Passwords must contain 8–72
characters. The command finds an existing user by their trimmed, lowercase email address, resets
their password through Better Auth, and revokes their existing sessions. It also creates password
credentials for an existing user who does not have them yet. It does not create a user or send email.

For automation, pipe the password from a secret manager or another secure input source:

```bash
bun run auth:reset-password --email user@example.com --password-stdin < /secure/path/password.txt
```

One trailing line ending is removed; other whitespace is preserved. Passwords are never accepted
as command arguments or printed by the command. Invalid input, an unknown user, or a failed reset
produces a nonzero exit status. Use `--help` for usage.

This operator command runs inside the API application and requires direct database access. It uses
the same [repository-root environment configuration](environment.md) as the API. To select the
production environment, prefix the command with `NODE_ENV=production`. The API server and SMTP
server do not need to be running. An internal, short-lived verification is consumed by Better Auth's
reset flow and cleaned up if the reset fails.
