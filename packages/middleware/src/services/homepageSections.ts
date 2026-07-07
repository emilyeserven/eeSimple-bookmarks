import { asc, eq, sql } from "drizzle-orm";
import type {
  Bookmark,
  ConditionTree,
  CreateHomepageSectionInput,
  HomepageSection,
  HomepageSectionBookmarks,
  UpdateHomepageSectionInput,
} from "@eesimple/types";
import type { BookmarkImageVisibility, HomepageSectionImageLayout, ViewMode } from "@eesimple/types";
import { emptyConditionTree, evaluateConditions } from "@eesimple/types";
import { db } from "@/db";
import {
  homepageFilter,
  homepageSections,
} from "@/db/schema";
import { getBookmarkEvaluationData } from "@/services/bookmarkCache";
import { hydrateBookmarkRows } from "@/services/bookmarkHydration";

type SectionRow = typeof homepageSections.$inferSelect;

function toSection(row: SectionRow): HomepageSection {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    conditions: row.conditions,
    sortOrder: row.sortOrder,
    hideIfEmpty: row.hideIfEmpty,
    columns: row.columns,
    imageMode: row.imageCropMode ?? (row.imageMode ? "natural" : "cropped"),
    imageLayout: row.imageLayout as HomepageSectionImageLayout,
    imageVisibility: row.imageVisibility as BookmarkImageVisibility,
    viewMode: row.viewMode as ViewMode,
    fieldZones: row.fieldZones ?? null,
    cardZoneLayouts: row.cardZoneLayouts ?? null,
    hiddenCardFields: row.hiddenCardFields ?? [],
    cornerOverlays: row.cornerOverlays,
    hideWebsiteForYouTube: row.hideWebsiteForYouTube,
    sort: row.sort ?? null,
    bookmarkLimit: row.bookmarkLimit ?? null,
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
      hideIfEmpty: input.hideIfEmpty ?? false,
      columns: input.columns ?? 2,
      imageCropMode: input.imageMode ?? "natural",
      imageLayout: input.imageLayout ?? "above",
      imageVisibility: input.imageVisibility ?? "shown",
      viewMode: input.viewMode ?? "cards",
      fieldZones: input.fieldZones ?? null,
      cardZoneLayouts: input.cardZoneLayouts ?? null,
      hiddenCardFields: input.hiddenCardFields ?? [],
      cornerOverlays: input.cornerOverlays ?? true,
      hideWebsiteForYouTube: input.hideWebsiteForYouTube ?? false,
      sort: input.sort ?? null,
      bookmarkLimit: input.bookmarkLimit ?? null,
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
  if (input.hideIfEmpty !== undefined) updates.hideIfEmpty = input.hideIfEmpty;
  if (input.columns !== undefined) updates.columns = input.columns;
  if (input.imageMode !== undefined) updates.imageCropMode = input.imageMode;
  if (input.imageLayout !== undefined) updates.imageLayout = input.imageLayout;
  if (input.imageVisibility !== undefined) updates.imageVisibility = input.imageVisibility;
  if (input.viewMode !== undefined) updates.viewMode = input.viewMode;
  if (input.fieldZones !== undefined) updates.fieldZones = input.fieldZones;
  if (input.cardZoneLayouts !== undefined) updates.cardZoneLayouts = input.cardZoneLayouts;
  if (input.hiddenCardFields !== undefined) updates.hiddenCardFields = input.hiddenCardFields;
  if (input.cornerOverlays !== undefined) updates.cornerOverlays = input.cornerOverlays;
  if (input.hideWebsiteForYouTube !== undefined) updates.hideWebsiteForYouTube = input.hideWebsiteForYouTube;
  if (input.sort !== undefined) updates.sort = input.sort;
  if (input.bookmarkLimit !== undefined) updates.bookmarkLimit = input.bookmarkLimit;

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

  const {
    baseRows, conditionInputs, tagDescendants, locationDescendants,
  } = await getBookmarkEvaluationData();
  if (baseRows.length === 0) {
    return sections.map(section => ({
      section,
      bookmarks: [],
    }));
  }

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
          locationDescendants,
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
