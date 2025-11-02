import { eq } from "drizzle-orm";

import type { Database } from "@/client";
import { users } from "@/schema";

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
      user_id: users.id,
      user_name: users.name,
      user_email: users.email,
      user_created_at: users.createdAt,
      user_updated_at: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);

  return row ?? null;
}
