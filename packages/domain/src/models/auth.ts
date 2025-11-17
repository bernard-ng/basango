import { z } from "@hono/zod-openapi";

export const loginSchema = z.object({
  email: z.email().openapi({
    description: "Email address used to authenticate the user.",
    example: "user@example.com",
  }),
  password: z.string().min(8).openapi({
    description: "Account password.",
    example: "••••••••",
  }),
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(1).openapi({
    description: "Refresh token returned when logging in.",
  }),
});
