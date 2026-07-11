import { asc, eq } from "drizzle-orm";
import type {
  CreateParseTemplateInput,
  ParseTemplate,
  UpdateParseTemplateInput,
} from "@eesimple/types";
import { db } from "@/db";
import { parseTemplates, type ParseTemplateRow } from "@/db/schema";

function toParseTemplate(row: ParseTemplateRow): ParseTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    delineator: row.delineator,
    pattern: row.pattern,
    fallbackTag: row.fallbackTag,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listParseTemplates(): Promise<ParseTemplate[]> {
  const rows = await db
    .select()
    .from(parseTemplates)
    .orderBy(asc(parseTemplates.name));
  return rows.map(toParseTemplate);
}

export async function getParseTemplateById(id: string): Promise<ParseTemplate | null> {
  const [row] = await db
    .select()
    .from(parseTemplates)
    .where(eq(parseTemplates.id, id));
  return row ? toParseTemplate(row) : null;
}

export async function createParseTemplate(
  input: CreateParseTemplateInput,
): Promise<ParseTemplate> {
  const [row] = await db
    .insert(parseTemplates)
    .values({
      name: input.name,
      description: input.description ?? null,
      delineator: input.delineator,
      pattern: input.pattern,
      fallbackTag: input.fallbackTag ?? "name",
    })
    .returning();
  return toParseTemplate(row);
}

export async function updateParseTemplate(
  id: string,
  input: UpdateParseTemplateInput,
): Promise<ParseTemplate | null> {
  const updates: Partial<typeof parseTemplates.$inferInsert> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.delineator !== undefined) updates.delineator = input.delineator;
  if (input.pattern !== undefined) updates.pattern = input.pattern;
  if (input.fallbackTag !== undefined) updates.fallbackTag = input.fallbackTag;

  if (Object.keys(updates).length === 0) {
    return getParseTemplateById(id);
  }

  const [row] = await db
    .update(parseTemplates)
    .set(updates)
    .where(eq(parseTemplates.id, id))
    .returning();
  return row ? toParseTemplate(row) : null;
}

export async function deleteParseTemplate(id: string): Promise<boolean> {
  const result = await db
    .delete(parseTemplates)
    .where(eq(parseTemplates.id, id))
    .returning({
      id: parseTemplates.id,
    });
  return result.length > 0;
}
