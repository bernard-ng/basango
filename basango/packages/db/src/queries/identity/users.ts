import { eq } from "drizzle-orm";

import type { Database } from "@db/client";
import { appUsers } from "@db/schema";

export interface UserProfileRow {
  user_id: string;
  user_name: string;
  user_email: string;
  user_created_at: string;
  user_updated_at: string | null;
}

export async function getUserProfile(
  db: Database,
  params: { userId: string },
): Promise<UserProfileRow | null> {
  const [row] = await db
    .select({
      user_id: appUsers.id,
      user_name: appUsers.name,
      user_email: appUsers.email,
      user_created_at: appUsers.createdAt,
      user_updated_at: appUsers.updatedAt,
    })
    .from(appUsers)
    .where(eq(appUsers.id, params.userId))
    .limit(1);

  return row ?? null;
}
