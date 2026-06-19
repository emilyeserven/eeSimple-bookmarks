import { asc, eq } from "drizzle-orm";
import type {
  CreateDisplayPresetInput,
  DisplayPreset,
  UpdateDisplayPresetInput,
} from "@eesimple/types";
import { db } from "@/db";
import { displayPresets, type DisplayPresetRow } from "@/db/schema";

function toDisplayPreset(row: DisplayPresetRow): DisplayPreset {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    settings: row.settings,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listDisplayPresets(): Promise<DisplayPreset[]> {
  const rows = await db
    .select()
    .from(displayPresets)
    .orderBy(asc(displayPresets.name));
  return rows.map(toDisplayPreset);
}

export async function getDisplayPresetById(id: string): Promise<DisplayPreset | null> {
  const [row] = await db
    .select()
    .from(displayPresets)
    .where(eq(displayPresets.id, id));
  return row ? toDisplayPreset(row) : null;
}

export async function createDisplayPreset(input: CreateDisplayPresetInput): Promise<DisplayPreset> {
  const [row] = await db
    .insert(displayPresets)
    .values({
      name: input.name,
      description: input.description ?? null,
      settings: input.settings,
    })
    .returning();
  return toDisplayPreset(row);
}

export async function updateDisplayPreset(
  id: string,
  input: UpdateDisplayPresetInput,
): Promise<DisplayPreset | null> {
  const updates: Partial<typeof displayPresets.$inferInsert> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.settings !== undefined) updates.settings = input.settings;

  if (Object.keys(updates).length === 0) {
    return getDisplayPresetById(id);
  }

  const [row] = await db
    .update(displayPresets)
    .set(updates)
    .where(eq(displayPresets.id, id))
    .returning();
  return row ? toDisplayPreset(row) : null;
}

export async function deleteDisplayPreset(id: string): Promise<boolean> {
  const result = await db
    .delete(displayPresets)
    .where(eq(displayPresets.id, id))
    .returning({
      id: displayPresets.id,
    });
  return result.length > 0;
}
