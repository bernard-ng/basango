import { passwordSchema } from "@basango/domain/models";
import { z } from "zod";

const roleSchema = z.enum(["user", "admin"]);
const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(255);

export const createUserFormSchema = z
  .object({
    confirmPassword: passwordSchema,
    email: emailSchema,
    name: nameSchema,
    password: passwordSchema,
    role: roleSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export const editUserFormSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  role: roleSchema,
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export const banUserFormSchema = z.object({
  banReason: z.string().trim().min(3, "Give a short reason for this ban").max(500),
  duration: z.enum(["day", "week", "month", "permanent"]),
});

export type BanUserFormValues = z.infer<typeof banUserFormSchema>;

export const setUserPasswordFormSchema = z
  .object({
    confirmPassword: passwordSchema,
    password: passwordSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type SetUserPasswordFormValues = z.infer<typeof setUserPasswordFormSchema>;

export function getBanDurationSeconds(duration: BanUserFormValues["duration"]): number | undefined {
  const durationInSeconds = {
    day: 60 * 60 * 24,
    month: 60 * 60 * 24 * 30,
    permanent: undefined,
    week: 60 * 60 * 24 * 7,
  } as const;

  return durationInSeconds[duration];
}
