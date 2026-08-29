import z from "zod";

const apiUrlSchema = z.url();

export function getPublicApiUrl(): string {
  return apiUrlSchema.parse(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3080");
}
