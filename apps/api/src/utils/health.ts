import { checkHealth as checkDbHealth } from "@basango/db/utils/health";

export async function checkHealth(): Promise<void> {
  await checkDbHealth();
}
