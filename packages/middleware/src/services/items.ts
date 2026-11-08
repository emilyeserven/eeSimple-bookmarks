import type { CreateItemInput, Item, UpdateItemInput } from "@app/types";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { DuplicateNameError, NotFoundError } from "@/utils/errors";
import { uniqueSlug } from "@/utils/slug";

type ItemRow = typeof items.$inferSelect;

/** Map a DB row to the wire shape (dates → ISO strings). */
function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

async function takenSlugs(exceptId?: string): Promise<string[]> {
  const rows = await db.select().from(items);
  return rows.filter(row => row.id !== exceptId).map(row => row.slug);
}

async function assertNameFree(name: string, exceptId?: string): Promise<void> {
  const rows = await db.select().from(items).where(eq(items.name, name));
  if (rows.some(row => row.id !== exceptId)) throw new DuplicateNameError("item", name);
}

export async function listItems(): Promise<Item[]> {
  const rows = await db.select().from(items).orderBy(asc(items.name));
  return rows.map(toItem);
}

export async function getItem(id: string): Promise<Item> {
  const [row] = await db.select().from(items).where(eq(items.id, id));
  if (!row) throw new NotFoundError("Item");
  return toItem(row);
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const name = input.name.trim();
  await assertNameFree(name);
  const now = new Date();
  const [row] = await db.insert(items).values({
    name,
    slug: uniqueSlug(name, await takenSlugs(), "item"),
    description: input.description ?? null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return toItem(row);
}

export async function updateItem(id: string, input: UpdateItemInput): Promise<Item> {
  const existing = await getItem(id);
  const patch: Partial<typeof items.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    await assertNameFree(name, id);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "item");
  }
  if (input.description !== undefined) patch.description = input.description;
  const [row] = await db.update(items).set(patch).where(eq(items.id, id)).returning();
  return toItem(row);
}

export async function deleteItem(id: string): Promise<void> {
  const deleted = await db.delete(items).where(eq(items.id, id)).returning();
  if (deleted.length === 0) throw new NotFoundError("Item");
}
