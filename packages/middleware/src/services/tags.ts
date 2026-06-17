import { asc, eq, sql } from "drizzle-orm";
import type { CreateTagInput, Tag, TagNode, UpdateTagInput } from "@eesimple/types";
import { db } from "@/db";
import { tags, type TagRow } from "@/db/schema";

/** Thrown when a reparent would put a tag under itself or one of its descendants. */
export class TagCycleError extends Error {
  constructor() {
    super("Cannot move a tag under itself or one of its descendants");
    this.name = "TagCycleError";
  }
}

/** Map a DB row to the shared `Tag` wire type. */
function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/**
 * Build a nested tree from a flat tag list (roots first). Pure — kept separate
 * from DB access so it can be unit-tested with in-memory data.
 */
export function buildTagTree(all: Tag[]): TagNode[] {
  const byId = new Map<string, TagNode>(all.map(tag => [tag.id, {
    ...tag,
    children: [],
  }]));
  const roots: TagNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/**
 * Resolve a tag id to the set of ids in its subtree (inclusive). Pure — operates
 * on a flat list so it can be unit-tested without a database.
 */
export function collectSubtreeIds(all: Tag[], rootId: string): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const tag of all) {
    if (!tag.parentId) continue;
    const siblings = childrenByParent.get(tag.parentId) ?? [];
    siblings.push(tag.id);
    childrenByParent.set(tag.parentId, siblings);
  }
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const child of childrenByParent.get(id) ?? []) stack.push(child);
  }
  return result;
}

/**
 * Whether reparenting `id` under `newParentId` would create a cycle (the new
 * parent is the tag itself or one of its descendants). Pure helper.
 */
export function wouldCreateCycle(all: Tag[], id: string, newParentId: string): boolean {
  return collectSubtreeIds(all, id).has(newParentId);
}

export async function listTags(): Promise<Tag[]> {
  const rows = await db.select().from(tags).orderBy(asc(tags.name));
  return rows.map(toTag);
}

export async function getTagTree(): Promise<TagNode[]> {
  return buildTagTree(await listTags());
}

/**
 * Resolve a tag id to the set of ids in its subtree (inclusive) via a recursive
 * CTE. The `.rows` access is the one spot coupled to node-postgres' result shape.
 */
export async function getDescendantIds(rootId: string): Promise<Set<string>> {
  // node-postgres' `execute` resolves to a `pg.QueryResult` whose `.rows` holds
  // the data; the cast pins that shape and keeps the coupling in one place.
  const result = (await db.execute<{ id: string }>(sql`
    WITH RECURSIVE subtree AS (
      SELECT ${tags.id} FROM ${tags} WHERE ${tags.id} = ${rootId}
      UNION ALL
      SELECT t.id FROM ${tags} t
      INNER JOIN subtree s ON t.parent_id = s.id
    )
    SELECT id FROM subtree
  `)) as unknown as { rows: { id: string }[] };
  return new Set(result.rows.map(row => row.id));
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const [row] = await db
    .insert(tags)
    .values({
      name: input.name,
      parentId: input.parentId ?? null,
    })
    .returning();
  return toTag(row);
}

export async function updateTag(id: string, input: UpdateTagInput): Promise<Tag | null> {
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new TagCycleError();
    const all = await listTags();
    if (wouldCreateCycle(all, id, input.parentId)) throw new TagCycleError();
  }

  const patch: Partial<Pick<TagRow, "name" | "parentId">> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.parentId !== undefined) patch.parentId = input.parentId;

  const [row] = await db.update(tags).set(patch).where(eq(tags.id, id)).returning();
  return row ? toTag(row) : null;
}

export async function deleteTag(id: string): Promise<boolean> {
  // FK cascade removes descendant tags and any bookmark_tags link rows.
  const rows = await db.delete(tags).where(eq(tags.id, id)).returning({
    id: tags.id,
  });
  return rows.length > 0;
}
