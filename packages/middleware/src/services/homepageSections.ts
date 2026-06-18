import { asc, eq, inArray, sql } from "drizzle-orm";
import type {
  Bookmark,
  ConditionInput,
  ConditionTree,
  CreateHomepageSectionInput,
  HomepageSection,
  HomepageSectionBookmarks,
  UpdateHomepageSectionInput,
} from "@eesimple/types";
import { buildTagDescendants, emptyConditionTree, evaluateConditions } from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkNumberValues,
  bookmarks,
  bookmarkTags,
  homepageFilter,
  homepageSections,
} from "@/db/schema";
import { ensureDefaultCategory } from "@/services/categories";
import { hydrateBookmarkRows } from "@/services/bookmarks";
import { listTags } from "@/services/tags";

type SectionRow = typeof homepageSections.$inferSelect;
type BookmarkRow = typeof bookmarks.$inferSelect;

function toSection(row: SectionRow): HomepageSection {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    conditions: row.conditions,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** List all homepage sections ordered by sortOrder ASC, createdAt ASC. */
export async function listHomepageSections(): Promise<HomepageSection[]> {
  const rows = await db
    .select()
    .from(homepageSections)
    .orderBy(asc(homepageSections.sortOrder), asc(homepageSections.createdAt));
  return rows.map(toSection);
}

/** Create a new homepage section. sortOrder defaults to one more than the current max. */
export async function createHomepageSection(
  input: CreateHomepageSectionInput,
): Promise<HomepageSection> {
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const [{
      max,
    }] = await db
      .select({
        max: sql<number>`COALESCE(MAX(${homepageSections.sortOrder}), -1)`,
      })
      .from(homepageSections);
    sortOrder = (max ?? -1) + 1;
  }
  const [row] = await db
    .insert(homepageSections)
    .values({
      title: input.title,
      description: input.description ?? null,
      conditions: input.conditions,
      sortOrder,
    })
    .returning();
  return toSection(row);
}

/** Partially update a homepage section. Returns null when the id is not found. */
export async function updateHomepageSection(
  id: string,
  input: UpdateHomepageSectionInput,
): Promise<HomepageSection | null> {
  const updates: Partial<typeof homepageSections.$inferInsert> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.conditions !== undefined) updates.conditions = input.conditions;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;

  if (Object.keys(updates).length === 0) {
    const [existing] = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.id, id));
    return existing ? toSection(existing) : null;
  }

  const [row] = await db
    .update(homepageSections)
    .set(updates)
    .where(eq(homepageSections.id, id))
    .returning();
  return row ? toSection(row) : null;
}

/** Delete a homepage section by id. */
export async function deleteHomepageSection(id: string): Promise<void> {
  await db.delete(homepageSections).where(eq(homepageSections.id, id));
}

/**
 * Reorder homepage sections. Accepts an ordered list of ids and writes each section's
 * `sortOrder` as its index position. Unknown ids are silently ignored.
 */
export async function reorderHomepageSections(orderedIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(homepageSections)
        .set({
          sortOrder: i,
        })
        .where(eq(homepageSections.id, orderedIds[i]));
    }
  });
}

/**
 * Fetch all homepage sections with their matching bookmarks. All bookmark rows are loaded once
 * and evaluated in-memory against each section's conditions (mirrors `listHomepageBookmarks`).
 */
export async function listHomepageSectionBookmarks(): Promise<HomepageSectionBookmarks[]> {
  const sections = await listHomepageSections();
  if (sections.length === 0) return [];

  const defaultCategoryId = await ensureDefaultCategory();
  const tagDescendants = buildTagDescendants(await listTags());

  const baseRows = await db.select().from(bookmarks);
  if (baseRows.length === 0) {
    return sections.map(section => ({
      section,
      bookmarks: [],
    }));
  }

  const conditionInputs = await buildConditionInputs(baseRows, defaultCategoryId);

  const allMatchedIds = new Set<string>();
  const sectionMatches: { section: HomepageSection;
    ids: string[]; }[] = [];

  for (const section of sections) {
    const matched = baseRows
      .filter((row) => {
        const input = conditionInputs.get(row.id);
        if (!input) return false;
        return evaluateConditions(section.conditions, input, {
          tagDescendants,
        });
      })
      .sort((a, b) =>
        b.priority - a.priority
        || (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    const ids = matched.map(r => r.id);
    for (const id of ids) allMatchedIds.add(id);
    sectionMatches.push({
      section,
      ids,
    });
  }

  // Hydrate all matched rows in one pass to avoid N+1 queries.
  const matchedRows = baseRows.filter(r => allMatchedIds.has(r.id));
  const hydrated = await hydrateBookmarkRows(matchedRows);
  const hydratedById = new Map<string, Bookmark>(hydrated.map(b => [b.id, b]));

  return sectionMatches.map(({
    section, ids,
  }) => ({
    section,
    bookmarks: ids.map(id => hydratedById.get(id)).filter((b): b is Bookmark => b !== undefined),
  }));
}

/** Load per-bookmark condition inputs for in-memory filter evaluation. */
async function buildConditionInputs(
  baseRows: BookmarkRow[],
  defaultCategoryId: string,
): Promise<Map<string, ConditionInput>> {
  const ids = baseRows.map(row => row.id);

  const [tagRows, numberRows, booleanRows] = await Promise.all([
    db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
        tagId: bookmarkTags.tagId,
      })
      .from(bookmarkTags)
      .where(inArray(bookmarkTags.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkNumberValues.bookmarkId,
        propertyId: bookmarkNumberValues.propertyId,
        value: bookmarkNumberValues.value,
      })
      .from(bookmarkNumberValues)
      .where(inArray(bookmarkNumberValues.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkBooleanValues.bookmarkId,
        propertyId: bookmarkBooleanValues.propertyId,
        value: bookmarkBooleanValues.value,
      })
      .from(bookmarkBooleanValues)
      .where(inArray(bookmarkBooleanValues.bookmarkId, ids)),
  ]);

  const tagsByBid = new Map<string, Set<string>>();
  for (const r of tagRows) {
    const s = tagsByBid.get(r.bookmarkId) ?? new Set<string>();
    s.add(r.tagId);
    tagsByBid.set(r.bookmarkId, s);
  }

  const numsByBid = new Map<string, Map<string, number>>();
  for (const r of numberRows) {
    const m = numsByBid.get(r.bookmarkId) ?? new Map<string, number>();
    m.set(r.propertyId, r.value);
    numsByBid.set(r.bookmarkId, m);
  }

  const boolsByBid = new Map<string, Map<string, boolean>>();
  for (const r of booleanRows) {
    const m = boolsByBid.get(r.bookmarkId) ?? new Map<string, boolean>();
    m.set(r.propertyId, r.value);
    boolsByBid.set(r.bookmarkId, m);
  }

  const result = new Map<string, ConditionInput>();
  for (const row of baseRows) {
    result.set(row.id, {
      url: row.url,
      title: row.title,
      categoryId: row.categoryId ?? defaultCategoryId,
      tagIds: tagsByBid.get(row.id) ?? new Set(),
      numberValues: numsByBid.get(row.id) ?? new Map(),
      booleanValues: boolsByBid.get(row.id) ?? new Map(),
    });
  }
  return result;
}

/**
 * Seed the homepage sections on first boot. If the table is empty, migrate the existing
 * `homepage_filter` conditions into a single "My Bookmarks" section. Idempotent.
 */
export async function ensureHomepageSections(): Promise<void> {
  const [{
    count,
  }] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(homepageSections);
  if (Number(count) > 0) return;

  const [filterRow] = await db.select().from(homepageFilter);
  const conditions: ConditionTree = filterRow?.conditions ?? emptyConditionTree();

  await db.insert(homepageSections).values({
    title: "My Bookmarks",
    description: null,
    conditions,
    sortOrder: 0,
  });
}
