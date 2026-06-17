import { asc, eq } from "drizzle-orm";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@eesimple/types";
import { db } from "@/db";
import {
  categories,
  type CategoryRow,
} from "@/db/schema";

/** Map a DB row to the shared `Category` wire type. */
function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories).orderBy(asc(categories.name));
  return rows.map(toCategory);
}

export async function getCategory(id: string): Promise<Category | null> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  return row ? toCategory(row) : null;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
    })
    .returning();
  return toCategory(row);
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<Category | null> {
  const patch: Partial<Pick<CategoryRow, "name" | "description" | "icon">> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.icon !== undefined) patch.icon = input.icon ?? null;

  if (Object.keys(patch).length === 0) return getCategory(id);

  const [row] = await db
    .update(categories)
    .set(patch)
    .where(eq(categories.id, id))
    .returning();
  return row ? toCategory(row) : null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  // FK cascade removes this category's property_categories links.
  const rows = await db.delete(categories).where(eq(categories.id, id)).returning({
    id: categories.id,
  });
  return rows.length > 0;
}
