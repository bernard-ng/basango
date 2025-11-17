import { and, eq, ilike } from "drizzle-orm";

import { Database } from "#db/client";
import { users } from "#db/schema";

export type User = typeof users.$inferSelect;

export async function getUserByEmail(db: Database, email: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: ilike(users.email, email),
  });
}

export async function getUserById(
  db: Database,
  params: { id: string; email?: string },
): Promise<User | undefined> {
  const { id, email } = params;

  return db.query.users.findFirst({
    where: email ? and(eq(users.id, id), ilike(users.email, email)) : eq(users.id, id),
  });
}
