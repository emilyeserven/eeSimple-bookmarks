/**
 * Merge a duplicate-bookmark group into one survivor (`POST /api/duplicates/merge`). Scalars follow
 * the request's per-field picks (each pick names the member whose stored value wins — the server
 * re-reads it, so a merge is never an arbitrary edit); every association is unioned onto the
 * survivor (the survivor's own row wins any collision); the losers are then deleted. All union sets
 * are computed in JS from a pre-transaction snapshot (select-then-branch, so the in-memory fake db
 * can exercise the logic), and the row writes run in one transaction — deliberately the first
 * tx-wrapped bookmark delete path (`deleteBookmark` predates transactions; don't reuse it here).
 *
 * Losers' screenshots / reel archives / non-moved images keep their S3 objects, which become
 * Gallery orphans by design (the same trade every existing delete path makes).
 */

import { eq, inArray, or } from "drizzle-orm";
import type { Bookmark, MergeBookmarksInput, MergeScalarField } from "@eesimple/types";
import { MERGE_SCALAR_FIELDS } from "@eesimple/types";
import { db } from "@/db";
import type { BookmarkRow } from "@/db/schema";
import {
  autofillRuleExemptions,
  bookmarkBooleanValues,
  bookmarkChoicesValues,
  bookmarkDateTimeValues,
  bookmarkFileValues,
  bookmarkGroups,
  bookmarkImages,
  bookmarkLocationBlacklist,
  bookmarkLocations,
  bookmarkTagBlacklist,
  bookmarkNumberValues,
  bookmarkPeople,
  bookmarkProgressValues,
  bookmarkRelationships,
  bookmarks,
  bookmarkSectionsValues,
  bookmarkTags,
  bookmarkTextValues,
  entityNames,
  importItems,
  languageUsages,
  mediaObjects,
  relationshipTypes,
  taxonomyAssignments,
} from "@/db/schema";
import { cleanupBookmarkEntityNames, cleanupBookmarkLanguageUsages, cleanupGenreMoodAssignments } from "@/services/bookmarkCleanup";
import { getBookmark } from "@/services/bookmarkCrud";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { MAX_BOOKMARK_IMAGES } from "@/services/bookmarkImages";
import type { Tx } from "@/services/bookmarkWrites";
import { recomputeCalculatedValues, recomputeDerivedProgress } from "@/services/bookmarkWrites";
import { NotFoundError, ValidationError } from "@/utils/errors";

/** The composite-PK join tables unioned by simple re-key, with the key columns that collide. */
const JOIN_TABLES = [
  {
    table: bookmarkTags,
    keyOf: (row: Record<string, unknown>) => String(row.tagId),
  },
  {
    table: bookmarkTagBlacklist,
    keyOf: (row: Record<string, unknown>) => String(row.tagId),
  },
  {
    table: bookmarkLocations,
    keyOf: (row: Record<string, unknown>) => String(row.locationId),
  },
  {
    table: bookmarkLocationBlacklist,
    keyOf: (row: Record<string, unknown>) => String(row.locationId),
  },
  {
    table: bookmarkPeople,
    keyOf: (row: Record<string, unknown>) => String(row.personId),
  },
  {
    table: bookmarkGroups,
    keyOf: (row: Record<string, unknown>) => String(row.groupId),
  },
  {
    table: autofillRuleExemptions,
    keyOf: (row: Record<string, unknown>) => String(row.ruleId),
  },
] as const;

/** The custom-property value tables, all keyed `(bookmarkId, propertyId)`. */
const VALUE_TABLES = [
  bookmarkNumberValues,
  bookmarkBooleanValues,
  bookmarkDateTimeValues,
  bookmarkChoicesValues,
  bookmarkProgressValues,
  bookmarkSectionsValues,
  bookmarkTextValues,
  bookmarkFileValues,
] as const;

interface RelationshipEdge {
  bookmarkAId: string;
  bookmarkBId: string;
  relationshipTypeId: string;
  label: string | null;
}

/**
 * Rewrite a member-touching edge set for the merge: substitute the survivor for any member id on
 * either side, drop the resulting self-edges (which is what kills survivor↔loser edges),
 * re-canonicalize symmetric pairs (smaller UUID in A — directional pairs keep parent-in-A as-is),
 * and dedupe on `(A, B, type)` preferring an edge that carries a label. Pure; exported for tests.
 */
export function rewriteRelationshipEdges(
  edges: RelationshipEdge[],
  memberIds: Set<string>,
  survivorId: string,
  directionalById: Map<string, boolean>,
): RelationshipEdge[] {
  const byKey = new Map<string, RelationshipEdge>();
  for (const edge of edges) {
    const directional = directionalById.get(edge.relationshipTypeId);
    if (directional === undefined) continue; // type row missing — skip defensively
    let a = memberIds.has(edge.bookmarkAId) ? survivorId : edge.bookmarkAId;
    let b = memberIds.has(edge.bookmarkBId) ? survivorId : edge.bookmarkBId;
    if (a === b) continue;
    if (!directional && a > b) [a, b] = [b, a];
    const key = `${a}:${b}:${edge.relationshipTypeId}`;
    const existing = byKey.get(key);
    if (existing && (existing.label !== null || edge.label === null)) continue;
    byKey.set(key, {
      bookmarkAId: a,
      bookmarkBId: b,
      relationshipTypeId: edge.relationshipTypeId,
      label: edge.label,
    });
  }
  return [...byKey.values()];
}

/** Loser rows to copy onto the survivor: dedupe against the survivor's keys, losers in given order. */
function unionRows<T>(
  rows: T[],
  ownerOf: (row: T) => string,
  keyOf: (row: T) => string,
  survivorId: string,
  loserIds: string[],
): T[] {
  const taken = new Set(rows.filter(row => ownerOf(row) === survivorId).map(keyOf));
  const copies: T[] = [];
  for (const loserId of loserIds) {
    for (const row of rows) {
      if (ownerOf(row) !== loserId) continue;
      const key = keyOf(row);
      if (taken.has(key)) continue;
      taken.add(key);
      copies.push(row);
    }
  }
  return copies;
}

export async function mergeBookmarks(input: MergeBookmarksInput): Promise<Bookmark> {
  const {
    survivorId, loserIds, fieldChoices,
  } = input;
  if (loserIds.includes(survivorId)) {
    throw new ValidationError("survivorId must not appear in loserIds");
  }
  if (new Set(loserIds).size !== loserIds.length) {
    throw new ValidationError("loserIds must not contain duplicates");
  }
  const memberIds = [survivorId, ...loserIds];
  const memberIdSet = new Set(memberIds);
  for (const [field, chosenId] of Object.entries(fieldChoices)) {
    if (chosenId !== undefined && !memberIdSet.has(chosenId)) {
      throw new ValidationError(`fieldChoices.${field} must reference a merged bookmark`);
    }
  }

  // ---- Pre-transaction snapshot (all union sets are computed in JS from these reads) ----

  const memberRows = (await db.select().from(bookmarks).where(inArray(bookmarks.id, memberIds)))
    .filter(row => memberIdSet.has(row.id));
  const rowById = new Map(memberRows.map(row => [row.id, row]));
  for (const id of memberIds) {
    if (!rowById.has(id)) throw new NotFoundError("Bookmark");
  }

  const patch: Partial<BookmarkRow> = {};
  for (const field of MERGE_SCALAR_FIELDS) {
    const chosenId = fieldChoices[field as MergeScalarField];
    if (chosenId === undefined || chosenId === survivorId) continue;
    patch[field] = rowById.get(chosenId)![field] as never;
  }

  const joinRowsByTable = new Map<unknown, Record<string, unknown>[]>();
  for (const {
    table,
  } of JOIN_TABLES) {
    const rows = (await db.select().from(table).where(inArray(table.bookmarkId, memberIds)))
      .filter(row => memberIdSet.has(String((row as Record<string, unknown>).bookmarkId)));
    joinRowsByTable.set(table, rows as Record<string, unknown>[]);
  }

  const valueRowsByTable = new Map<unknown, Record<string, unknown>[]>();
  for (const table of VALUE_TABLES) {
    const rows = (await db.select().from(table).where(inArray(table.bookmarkId, memberIds)))
      .filter(row => memberIdSet.has(String((row as Record<string, unknown>).bookmarkId)));
    valueRowsByTable.set(table, rows as Record<string, unknown>[]);
  }

  const imageRows = (await db
    .select()
    .from(bookmarkImages)
    .where(inArray(bookmarkImages.bookmarkId, memberIds)))
    .filter(row => memberIdSet.has(row.bookmarkId));

  const edgeRows = (await db
    .select()
    .from(bookmarkRelationships)
    .where(or(
      inArray(bookmarkRelationships.bookmarkAId, memberIds),
      inArray(bookmarkRelationships.bookmarkBId, memberIds),
    )))
    .filter(row => memberIdSet.has(row.bookmarkAId) || memberIdSet.has(row.bookmarkBId));
  const edgeTypeIds = [...new Set(edgeRows.map(row => row.relationshipTypeId))];
  const directionalById = new Map<string, boolean>();
  if (edgeTypeIds.length > 0) {
    const typeRows = (await db
      .select({
        id: relationshipTypes.id,
        directional: relationshipTypes.directional,
      })
      .from(relationshipTypes)
      .where(inArray(relationshipTypes.id, edgeTypeIds)))
      .filter(row => edgeTypeIds.includes(row.id));
    for (const row of typeRows) directionalById.set(row.id, row.directional);
  }
  const rewrittenEdges = rewriteRelationshipEdges(edgeRows, memberIdSet, survivorId, directionalById);

  // Polymorphic rows (no FK on ownerId): read the losers' rows now, write them back post-commit.
  const assignmentRows = (await db
    .select()
    .from(taxonomyAssignments)
    .where(inArray(taxonomyAssignments.ownerId, memberIds)))
    .filter(row => row.ownerType === "bookmark" && memberIdSet.has(row.ownerId));
  const nameRows = (await db
    .select()
    .from(entityNames)
    .where(inArray(entityNames.ownerId, memberIds)))
    .filter(row => row.ownerType === "bookmark" && memberIdSet.has(row.ownerId));
  const usageRows = (await db
    .select()
    .from(languageUsages)
    .where(inArray(languageUsages.ownerId, memberIds)))
    .filter(row => row.ownerType === "bookmark" && memberIdSet.has(row.ownerId));

  // ---- Transaction: every row write, losers deleted last ----

  await db.transaction(async (tx: Tx) => {
    // Free the losers' urls first so a picked loser url can land on the survivor without
    // tripping `bookmarks_url_unique`.
    await tx.update(bookmarks).set({
      url: null,
    }).where(inArray(bookmarks.id, loserIds));

    await tx.update(bookmarks).set({
      ...patch,
      updatedAt: new Date(),
    }).where(eq(bookmarks.id, survivorId));

    for (const {
      table, keyOf,
    } of JOIN_TABLES) {
      const rows = joinRowsByTable.get(table) ?? [];
      const copies = unionRows(rows, row => String(row.bookmarkId), keyOf, survivorId, loserIds)
        .map(row => ({
          ...row,
          bookmarkId: survivorId,
        }));
      if (copies.length > 0) {
        await tx.insert(table).values(copies as never[]).onConflictDoNothing();
      }
    }

    // Images: append the losers' images after the survivor's, up to the cap; the first moved image
    // becomes main only when the survivor had none (single-`isMain` invariant).
    const survivorImages = imageRows.filter(row => row.bookmarkId === survivorId);
    const loserImages = loserIds.flatMap(loserId => imageRows
      .filter(row => row.bookmarkId === loserId)
      .sort((a, b) => a.sortOrder - b.sortOrder));
    const room = Math.max(0, MAX_BOOKMARK_IMAGES - survivorImages.length);
    const moved = loserImages.slice(0, room);
    const maxSort = survivorImages.reduce((max, row) => Math.max(max, row.sortOrder), -1);
    for (const [index, image] of moved.entries()) {
      await tx.update(bookmarkImages).set({
        bookmarkId: survivorId,
        isMain: survivorImages.length === 0 && index === 0,
        sortOrder: maxSort + 1 + index,
      }).where(eq(bookmarkImages.id, image.id));
    }
    // Keep the gallery ledger pointing at the surviving owner for every moved image's object.
    if (moved.length > 0) {
      await tx.update(mediaObjects).set({
        bookmarkId: survivorId,
      }).where(inArray(mediaObjects.objectKey, moved.map(image => image.objectKey)));
    }

    for (const table of VALUE_TABLES) {
      const rows = valueRowsByTable.get(table) ?? [];
      const copies = unionRows(rows, row => String(row.bookmarkId), row => String(row.propertyId), survivorId, loserIds)
        .map(row => ({
          ...row,
          bookmarkId: survivorId,
        }));
      if (copies.length > 0) {
        await tx.insert(table).values(copies as never[]).onConflictDoNothing();
        // A moved file value carries an object — keep the gallery ledger on the survivor.
        if (table === bookmarkFileValues) {
          const keys = copies.map(row => String((row as Record<string, unknown>).objectKey));
          await tx.update(mediaObjects).set({
            bookmarkId: survivorId,
          }).where(inArray(mediaObjects.objectKey, keys));
        }
      }
    }

    // Relationships: replace every member-touching edge with the rewritten (deduped) set.
    if (edgeRows.length > 0) {
      await tx.delete(bookmarkRelationships).where(or(
        inArray(bookmarkRelationships.bookmarkAId, memberIds),
        inArray(bookmarkRelationships.bookmarkBId, memberIds),
      ));
      if (rewrittenEdges.length > 0) {
        await tx.insert(bookmarkRelationships).values(rewrittenEdges);
      }
    }

    // Import bookkeeping follows the surviving bookmark.
    await tx.update(importItems).set({
      duplicateBookmarkId: survivorId,
    }).where(inArray(importItems.duplicateBookmarkId, loserIds));
    await tx.update(importItems).set({
      createdBookmarkId: survivorId,
    }).where(inArray(importItems.createdBookmarkId, loserIds));

    await tx.delete(bookmarks).where(inArray(bookmarks.id, loserIds));

    await recomputeCalculatedValues(tx, survivorId);
    await recomputeDerivedProgress(tx, survivorId);
  });

  // ---- Post-commit: polymorphic unions (no FK on ownerId — the losers' rows survived the delete),
  // then the standard delete-path cleanups. Mirrors the post-commit writes in `createBookmark`. ----

  const assignmentCopies = unionRows(
    assignmentRows,
    row => row.ownerId,
    row => row.termId,
    survivorId,
    loserIds,
  ).map(row => ({
    ...row,
    ownerId: survivorId,
  }));
  if (assignmentCopies.length > 0) {
    await db.insert(taxonomyAssignments).values(assignmentCopies).onConflictDoNothing();
  }

  const nameCopies = unionRows(nameRows, row => row.ownerId, row => row.languageId, survivorId, loserIds)
    .map(({
      id: _id, createdAt: _createdAt, ...row
    }) => ({
      ...row,
      ownerId: survivorId,
      // The survivor's own primary row stays the one mirror of its title.
      isPrimary: false,
    }));
  if (nameCopies.length > 0) {
    await db.insert(entityNames).values(nameCopies).onConflictDoNothing();
  }

  const usageCopies = unionRows(
    usageRows,
    row => row.ownerId,
    row => `${row.languageId}:${row.usageLevelId}`,
    survivorId,
    loserIds,
  ).map(({
    id: _id, createdAt: _createdAt, ...row
  }) => ({
    ...row,
    ownerId: survivorId,
  }));
  if (usageCopies.length > 0) {
    await db.insert(languageUsages).values(usageCopies).onConflictDoNothing();
  }

  await cleanupGenreMoodAssignments(loserIds);
  await cleanupBookmarkEntityNames(loserIds);
  await cleanupBookmarkLanguageUsages(loserIds);
  invalidateBookmarkCache();

  return (await getBookmark(survivorId))!;
}
