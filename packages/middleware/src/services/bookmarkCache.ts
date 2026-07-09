import { and, eq, inArray, or } from "drizzle-orm";
import type { BookmarkSectionsValue, ConditionInput, EvaluateOptions, SectionEntry, TagDescendants } from "@eesimple/types";
import { buildLocationDescendants, buildMediaTypeDescendants, buildTagDescendants, buildTaxonomyTermDescendants } from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkChoicesValues,
  bookmarkDateTimeValues,
  bookmarkFileValues,
  bookmarkLocations,
  bookmarkNumberValues,
  bookmarkProgressValues,
  bookmarkSectionsValues,
  bookmarkTextValues,
  bookmarkRelationships,
  bookmarks,
  type BookmarkRow,
  bookmarkTags,
  languageUsages,
  locations,
  mediaTypes,
  tags,
  taxonomyAssignments,
  taxonomyTerms,
} from "@/db/schema";
import { bookmarkCacheVersion } from "@/services/bookmarkCacheVersion";
import { resolveDefaultCategoryId } from "@/services/categories";
import { loadEntityNames } from "@/services/entityNames";

// Re-exported so writers keep one import site; the counter lives in a leaf module purely to let
// `services/categories.ts` (which the cache loads from) invalidate without a circular import.
export { invalidateBookmarkCache } from "@/services/bookmarkCacheVersion";

/**
 * In-memory cache of everything needed to evaluate a condition tree against every bookmark in one
 * pass: the base bookmark rows, their per-bookmark {@link ConditionInput}s, and a tag-descendant
 * resolver. This is the "load once, evaluate the shared predicate in-memory" pattern shared by the
 * homepage-section matcher and the autofill preview — see CLAUDE.md → "Data shaping".
 *
 * The middleware runs as a single process (the gateway spawns one child), so this cache is
 * coherent. It is invalidated by version bump, not eviction: every write that changes a bookmark's
 * *matchable* data (the bookmark row, its tags, or its custom-property values) — or the tag tree
 * that drives descendant resolution — must call {@link invalidateBookmarkCache}. The data is only
 * consumed by eventually-consistent surfaces, so a brief staleness window during a rebuild is fine.
 */
export interface BookmarkEvaluationData {
  /** All bookmark rows, loaded once. */
  baseRows: BookmarkRow[];
  /** Per-bookmark condition inputs keyed by bookmark id, for `evaluateConditions`. */
  conditionInputs: Map<string, ConditionInput>;
  /** Tag descendant resolver for tag conditions. */
  tagDescendants: TagDescendants;
  /** Location descendant resolver for location conditions. */
  locationDescendants: TagDescendants;
  /** Media-type descendant resolver for the per-item media-type cascade toggle. */
  mediaTypeDescendants: TagDescendants;
  /** User-taxonomy term descendant resolver (also backs the legacy genre-mood cascade toggle). */
  taxonomyTermDescendants: TagDescendants;
  /** The cascade resolvers pre-bundled as `EvaluateOptions` — pass straight to `evaluateConditions`. */
  evaluateOptions: EvaluateOptions;
}

let snapshot: { version: number;
  data: BookmarkEvaluationData; } | null = null;

/**
 * Return the (cached) {@link BookmarkEvaluationData}, rebuilding it whenever the cached snapshot
 * predates the current version. A concurrent invalidation during a rebuild simply forces the next
 * caller to rebuild again, so callers never observe data older than the moment they called.
 */
export async function getBookmarkEvaluationData(): Promise<BookmarkEvaluationData> {
  if (snapshot && snapshot.version === bookmarkCacheVersion()) return snapshot.data;
  const target = bookmarkCacheVersion();
  const data = await loadEvaluationData();
  // Publish only if no invalidation landed mid-load; otherwise leave the snapshot stale so the
  // next call rebuilds with the newer data.
  if (target === bookmarkCacheVersion()) {
    snapshot = {
      version: target,
      data,
    };
  }
  return data;
}

async function loadEvaluationData(): Promise<BookmarkEvaluationData> {
  const defaultCategoryId = await resolveDefaultCategoryId();

  // Only id/parentId are needed for descendant resolution — avoid the expensive count query in
  // `listTags` (and the circular import it would create).
  const tagRows = await db
    .select({
      id: tags.id,
      parentId: tags.parentId,
    })
    .from(tags);
  const tagDescendants = buildTagDescendants(tagRows);

  const locationRows = await db
    .select({
      id: locations.id,
      parentId: locations.parentId,
    })
    .from(locations);
  const locationDescendants = buildLocationDescendants(locationRows);

  const mediaTypeRows = await db
    .select({
      id: mediaTypes.id,
      parentId: mediaTypes.parentId,
    })
    .from(mediaTypes);
  const mediaTypeDescendants = buildMediaTypeDescendants(mediaTypeRows);

  const taxonomyTermRows = await db
    .select({
      id: taxonomyTerms.id,
      parentId: taxonomyTerms.parentId,
    })
    .from(taxonomyTerms);
  const taxonomyTermDescendants = buildTaxonomyTermDescendants(taxonomyTermRows);

  const baseRows = await db.select().from(bookmarks);
  const conditionInputs = await buildConditionInputs(baseRows, defaultCategoryId);
  return {
    baseRows,
    conditionInputs,
    tagDescendants,
    locationDescendants,
    mediaTypeDescendants,
    taxonomyTermDescendants,
    evaluateOptions: {
      tagDescendants,
      locationDescendants,
      mediaTypeDescendants,
      taxonomyTermDescendants,
    },
  };
}

/** Load per-bookmark condition inputs for in-memory filter evaluation, batched to avoid N+1. */
/** Group rows into `Map<bookmarkId, Set<value>>`. */
function groupToSets<T>(
  rows: readonly T[],
  bid: (row: T) => string,
  value: (row: T) => string,
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = out.get(bid(row)) ?? new Set<string>();
    set.add(value(row));
    out.set(bid(row), set);
  }
  return out;
}

/** Group rows into `Map<bookmarkId, Map<propertyId, value>>`. */
function groupToMaps<T, V>(
  rows: readonly T[],
  bid: (row: T) => string,
  key: (row: T) => string,
  value: (row: T) => V,
): Map<string, Map<string, V>> {
  const out = new Map<string, Map<string, V>>();
  for (const row of rows) {
    const map = out.get(bid(row)) ?? new Map<string, V>();
    map.set(key(row), value(row));
    out.set(bid(row), map);
  }
  return out;
}

/** The per-bookmark grouped value maps that back {@link assembleConditionInput}. */
export interface ConditionInputGroups {
  tagsByBid: Map<string, Set<string>>;
  taxonomyTermsByBid: Map<string, Set<string>>;
  locationsByBid: Map<string, Set<string>>;
  numsByBid: Map<string, Map<string, number>>;
  boolsByBid: Map<string, Map<string, boolean>>;
  datesByBid: Map<string, Map<string, string>>;
  choicesByBid: Map<string, Map<string, string[]>>;
  sectionsByBid: Map<string, Map<string, BookmarkSectionsValue>>;
  filesByBid: Map<string, Set<string>>;
  textsByBid: Map<string, Map<string, string>>;
  relTypesByBid: Map<string, Set<string>>;
  languageUsagesByBid: Map<string, { languageId: string;
    usageLevelId: string; }[]>;
  /** Per-bookmark language-labelled name values (values only), matched alongside title. */
  namesByBid: Map<string, string[]>;
}

/**
 * Assemble one bookmark's {@link ConditionInput} from its base row and the grouped value maps,
 * substituting an empty collection (or the default category) wherever the bookmark has no entry.
 * Pure, so it is unit-testable independently of the DB batch load.
 */
export function assembleConditionInput(
  row: BookmarkRow,
  groups: ConditionInputGroups,
  defaultCategoryId: string,
): ConditionInput {
  return {
    url: row.url ?? "",
    title: row.title,
    categoryId: row.categoryId ?? defaultCategoryId,
    tagIds: groups.tagsByBid.get(row.id) ?? new Set(),
    taxonomyTermIds: groups.taxonomyTermsByBid.get(row.id) ?? new Set(),
    locationIds: groups.locationsByBid.get(row.id) ?? new Set(),
    youtubeChannelId: row.youtubeChannelId ?? null,
    mediaTypeId: row.mediaTypeId ?? null,
    numberValues: groups.numsByBid.get(row.id) ?? new Map(),
    booleanValues: groups.boolsByBid.get(row.id) ?? new Map(),
    dateTimeValues: groups.datesByBid.get(row.id) ?? new Map(),
    choicesValues: groups.choicesByBid.get(row.id) ?? new Map(),
    sectionsValues: groups.sectionsByBid.get(row.id) ?? new Map(),
    fileValues: groups.filesByBid.get(row.id) ?? new Set(),
    textValues: groups.textsByBid.get(row.id) ?? new Map(),
    relationshipTypeIds: groups.relTypesByBid.get(row.id) ?? new Set(),
    languageUsages: groups.languageUsagesByBid.get(row.id) ?? [],
    names: groups.namesByBid.get(row.id) ?? [],
  };
}

async function buildConditionInputs(
  baseRows: BookmarkRow[],
  defaultCategoryId: string,
): Promise<Map<string, ConditionInput>> {
  const ids = baseRows.map(row => row.id);
  if (ids.length === 0) return new Map();

  const [tagRows, taxonomyTermRows, locationRows, numberRows, booleanRows, dateTimeRows, choicesRows, fileRows, progressRows, sectionsRows, textRows, relationshipRows, languageUsageRows] = await Promise.all([
    db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
        tagId: bookmarkTags.tagId,
      })
      .from(bookmarkTags)
      .where(inArray(bookmarkTags.bookmarkId, ids)),
    db
      .select({
        bookmarkId: taxonomyAssignments.ownerId,
        termId: taxonomyAssignments.termId,
      })
      .from(taxonomyAssignments)
      .where(and(
        eq(taxonomyAssignments.ownerType, "bookmark"),
        inArray(taxonomyAssignments.ownerId, ids),
      )),
    db
      .select({
        bookmarkId: bookmarkLocations.bookmarkId,
        locationId: bookmarkLocations.locationId,
      })
      .from(bookmarkLocations)
      .where(inArray(bookmarkLocations.bookmarkId, ids)),
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
    db
      .select({
        bookmarkId: bookmarkDateTimeValues.bookmarkId,
        propertyId: bookmarkDateTimeValues.propertyId,
        value: bookmarkDateTimeValues.value,
      })
      .from(bookmarkDateTimeValues)
      .where(inArray(bookmarkDateTimeValues.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkChoicesValues.bookmarkId,
        propertyId: bookmarkChoicesValues.propertyId,
        values: bookmarkChoicesValues.values,
      })
      .from(bookmarkChoicesValues)
      .where(inArray(bookmarkChoicesValues.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkFileValues.bookmarkId,
        propertyId: bookmarkFileValues.propertyId,
      })
      .from(bookmarkFileValues)
      .where(inArray(bookmarkFileValues.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkProgressValues.bookmarkId,
        propertyId: bookmarkProgressValues.propertyId,
        current: bookmarkProgressValues.current,
      })
      .from(bookmarkProgressValues)
      .where(inArray(bookmarkProgressValues.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkSectionsValues.bookmarkId,
        propertyId: bookmarkSectionsValues.propertyId,
        exhaustive: bookmarkSectionsValues.exhaustive,
        sections: bookmarkSectionsValues.sections,
      })
      .from(bookmarkSectionsValues)
      .where(inArray(bookmarkSectionsValues.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkTextValues.bookmarkId,
        propertyId: bookmarkTextValues.propertyId,
        value: bookmarkTextValues.value,
      })
      .from(bookmarkTextValues)
      .where(inArray(bookmarkTextValues.bookmarkId, ids)),
    db
      .select({
        bookmarkAId: bookmarkRelationships.bookmarkAId,
        bookmarkBId: bookmarkRelationships.bookmarkBId,
        relationshipTypeId: bookmarkRelationships.relationshipTypeId,
      })
      .from(bookmarkRelationships)
      .where(
        or(
          inArray(bookmarkRelationships.bookmarkAId, ids),
          inArray(bookmarkRelationships.bookmarkBId, ids),
        ),
      ),
    db
      .select({
        bookmarkId: languageUsages.ownerId,
        languageId: languageUsages.languageId,
        usageLevelId: languageUsages.usageLevelId,
      })
      .from(languageUsages)
      .where(and(eq(languageUsages.ownerType, "bookmark"), inArray(languageUsages.ownerId, ids))),
  ]);

  const tagsByBid = groupToSets(tagRows, r => r.bookmarkId, r => r.tagId);
  const taxonomyTermsByBid = groupToSets(taxonomyTermRows, r => r.bookmarkId, r => r.termId);
  const locationsByBid = groupToSets(locationRows, r => r.bookmarkId, r => r.locationId);
  const numsByBid = groupToMaps(numberRows, r => r.bookmarkId, r => r.propertyId, r => r.value);
  const boolsByBid = groupToMaps(booleanRows, r => r.bookmarkId, r => r.propertyId, r => r.value);
  const datesByBid = groupToMaps(dateTimeRows, r => r.bookmarkId, r => r.propertyId, r => r.value);
  const choicesByBid = groupToMaps(choicesRows, r => r.bookmarkId, r => r.propertyId, r => r.values as string[]);
  const filesByBid = groupToSets(fileRows, r => r.bookmarkId, r => r.propertyId);
  const textsByBid = groupToMaps(textRows, r => r.bookmarkId, r => r.propertyId, r => r.value);

  // Merge progress `current` values into numberValues so itemInItems filters like a number.
  for (const r of progressRows) {
    const m = numsByBid.get(r.bookmarkId) ?? new Map<string, number>();
    m.set(r.propertyId, r.current);
    numsByBid.set(r.bookmarkId, m);
  }

  const sectionsByBid = new Map<string, Map<string, BookmarkSectionsValue>>();
  for (const r of sectionsRows) {
    const m = sectionsByBid.get(r.bookmarkId) ?? new Map<string, BookmarkSectionsValue>();
    m.set(r.propertyId, {
      propertyId: r.propertyId,
      exhaustive: r.exhaustive,
      sections: r.sections as SectionEntry[],
    });
    sectionsByBid.set(r.bookmarkId, m);
  }

  // A bookmark "has" a relationship type if it sits on either side of an edge of that type.
  const idSet = new Set(ids);
  const relTypesByBid = new Map<string, Set<string>>();
  const addRelType = (bookmarkId: string, relationshipTypeId: string) => {
    if (!idSet.has(bookmarkId)) return;
    const s = relTypesByBid.get(bookmarkId) ?? new Set<string>();
    s.add(relationshipTypeId);
    relTypesByBid.set(bookmarkId, s);
  };
  for (const r of relationshipRows) {
    addRelType(r.bookmarkAId, r.relationshipTypeId);
    addRelType(r.bookmarkBId, r.relationshipTypeId);
  }

  const languageUsagesByBid = new Map<string, { languageId: string;
    usageLevelId: string; }[]>();
  for (const r of languageUsageRows) {
    const list = languageUsagesByBid.get(r.bookmarkId) ?? [];
    list.push({
      languageId: r.languageId,
      usageLevelId: r.usageLevelId,
    });
    languageUsagesByBid.set(r.bookmarkId, list);
  }

  // Language-labelled names (values only), so the shared predicate's title match sees every name
  // variant. The batched loader is the same one bookmark hydration uses — no N+1.
  const entityNamesByBid = await loadEntityNames("bookmark", ids);
  const namesByBid = new Map<string, string[]>();
  for (const [bookmarkId, names] of entityNamesByBid) {
    namesByBid.set(bookmarkId, names.map(name => name.value));
  }

  const groups: ConditionInputGroups = {
    tagsByBid,
    taxonomyTermsByBid,
    locationsByBid,
    numsByBid,
    boolsByBid,
    datesByBid,
    choicesByBid,
    sectionsByBid,
    filesByBid,
    textsByBid,
    relTypesByBid,
    languageUsagesByBid,
    namesByBid,
  };
  const result = new Map<string, ConditionInput>();
  for (const row of baseRows) {
    result.set(row.id, assembleConditionInput(row, groups, defaultCategoryId));
  }
  return result;
}
