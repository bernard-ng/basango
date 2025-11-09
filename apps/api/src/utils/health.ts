import { checkHealth as checkDbHealth } from "@basango/db";

export async function checkHealth(): Promise<void> {
  await checkDbHealth();
}
