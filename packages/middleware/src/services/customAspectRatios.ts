import type { CreateCustomAspectRatioInput, CustomAspectRatio } from "@eesimple/types";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { customAspectRatios } from "@/db/schema";

type Row = typeof customAspectRatios.$inferSelect;

function toCustomAspectRatio(row: Row): CustomAspectRatio {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listCustomAspectRatios(): Promise<CustomAspectRatio[]> {
  const rows = await db
    .select()
    .from(customAspectRatios)
    .orderBy(asc(customAspectRatios.createdAt));
  return rows.map(toCustomAspectRatio);
}

export async function createCustomAspectRatio(
  input: CreateCustomAspectRatioInput,
): Promise<CustomAspectRatio> {
  const [row] = await db
    .insert(customAspectRatios)
    .values({
      name: input.name,
      width: input.width,
      height: input.height,
    })
    .returning();
  return toCustomAspectRatio(row);
}

export async function deleteCustomAspectRatio(id: string): Promise<void> {
  await db.delete(customAspectRatios).where(eq(customAspectRatios.id, id));
}
