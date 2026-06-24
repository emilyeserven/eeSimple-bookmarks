import { asc, eq } from "drizzle-orm";
import type {
  CardFieldTemplate,
  CreateCardFieldTemplateInput,
} from "@eesimple/types";
import { db } from "@/db";
import { cardFieldTemplates, type CardFieldTemplateRow } from "@/db/schema";

function toCardFieldTemplate(row: CardFieldTemplateRow): CardFieldTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    fieldZones: row.fieldZones,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listCardFieldTemplates(): Promise<CardFieldTemplate[]> {
  const rows = await db
    .select()
    .from(cardFieldTemplates)
    .orderBy(asc(cardFieldTemplates.name));
  return rows.map(toCardFieldTemplate);
}

export async function createCardFieldTemplate(
  input: CreateCardFieldTemplateInput,
): Promise<CardFieldTemplate> {
  const [row] = await db
    .insert(cardFieldTemplates)
    .values({
      name: input.name,
      description: input.description ?? null,
      fieldZones: input.fieldZones,
    })
    .returning();
  return toCardFieldTemplate(row);
}

export async function deleteCardFieldTemplate(id: string): Promise<boolean> {
  const result = await db
    .delete(cardFieldTemplates)
    .where(eq(cardFieldTemplates.id, id))
    .returning({
      id: cardFieldTemplates.id,
    });
  return result.length > 0;
}
