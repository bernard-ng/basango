import z from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(1),
});
