import { eq } from "drizzle-orm";
import { v7 as uuidV7 } from "uuid";

import { Database } from "@/client";
import { NotFoundError } from "@/errors";
import { Credibility, source } from "@/schema";

export async function getSources(db: Database) {
  return db.query.source.findMany();
}

export type CreateSourceParams = {
  name: string;
  url: string;
  displayName?: string;
  description?: string;
  credibility?: Credibility;
};

export async function createSource(db: Database, params: CreateSourceParams) {
  const [result] = await db
    .insert(source)
    .values({ id: uuidV7(), ...params })
    .returning();

  return result;
}

export type UpdateSourceParams = {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  credibility?: Credibility;
};

export async function updateSource(db: Database, params: UpdateSourceParams) {
  const [result] = await db
    .update(source)
    .set({
      credibility: params.credibility,
      description: params.description,
      displayName: params.displayName,
      name: params.name,
    })
    .where(eq(source.id, params.id))
    .returning();

  if (result === undefined) {
    throw new NotFoundError(`Source not found`);
  }

  return result;
}

export type DeleteSourceParams = {
  id: string;
};

export async function deleteSource(db: Database, params: DeleteSourceParams) {
  const [result] = await db.delete(source).where(eq(source.id, params.id)).returning();

  return result;
}

export async function getSourceByName(db: Database, name: string) {
  return db.query.source.findFirst({
    where: eq(source.name, name),
  });
}

export async function getById(db: Database, id: string) {
  return db.query.source.findFirst({
    where: eq(source.id, id),
  });
}

export async function getSourceIdByName(db: Database, name: string): Promise<string> {
  const result = await db.query.source.findFirst({
    columns: {
      id: true,
    },
    where: eq(source.name, name),
  });

  if (!result) {
    throw new NotFoundError(`Source with name "${name}" not found`);
  }

  return result.id;
}

export type GetSourceByIdParams = {
  id: string;
};

export async function getSourceById(db: Database, params: GetSourceByIdParams) {
  return db.query.source.findFirst({
    where: eq(source.id, params.id),
  });
}
