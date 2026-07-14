import { db } from "@/db";
import type { TitleTagBackfillResult } from "@eesimple/types";
import { bookmarkLocations, bookmarks, bookmarkTags } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { loadEntityNames } from "@/services/entityNames";
import { listLocationNames, matchLocationIdsByTitle } from "@/services/locations";
import { listTagNames, matchTagIdsByTitle } from "@/services/tags";

/**
 * Apply the "auto-tag from title" automation to every existing bookmark, additively. Each bookmark's
 * title is matched against all tag names (whole-word, case-insensitive) and the matched tags are
 * inserted without removing any existing tags. Runs on demand regardless of the `autoApplyTitleTags`
 * toggle — that flag only governs the create-time behavior. `ON CONFLICT DO NOTHING ... RETURNING`
 * makes the insert idempotent and reports exactly the links that were newly added.
 */
export async function backfillTitleTags(): Promise<TitleTagBackfillResult> {
  const allTags = await listTagNames();
  const rows = await db
    .select({
      id: bookmarks.id,
      title: bookmarks.title,
    })
    .from(bookmarks);
  const namesByBid = await loadEntityNames("bookmark", rows.map(row => row.id));

  const links: { bookmarkId: string;
    tagId: string; }[] = [];
  for (const row of rows) {
    const titles = [row.title, ...(namesByBid.get(row.id) ?? []).map(n => n.value)];
    for (const tagId of matchTagIdsByTitle(titles, allTags)) {
      links.push({
        bookmarkId: row.id,
        tagId,
      });
    }
  }

  if (links.length === 0) {
    return {
      scanned: rows.length,
      updated: 0,
      tagsApplied: 0,
    };
  }

  const inserted = await db
    .insert(bookmarkTags)
    .values(links)
    .onConflictDoNothing()
    .returning({
      bookmarkId: bookmarkTags.bookmarkId,
    });
  if (inserted.length > 0) invalidateBookmarkCache();
  return {
    scanned: rows.length,
    updated: new Set(inserted.map(link => link.bookmarkId)).size,
    tagsApplied: inserted.length,
  };
}

/**
 * Apply the "auto-tag from title" automation for Locations to every existing bookmark, additively.
 * Mirrors {@link backfillTitleTags}: each bookmark's title is matched against every location's
 * name + names[] (multi-language names) + alternate names, and the matches are inserted idempotently.
 */
export async function backfillTitleLocations(): Promise<TitleTagBackfillResult> {
  const allLocations = await listLocationNames();
  const rows = await db
    .select({
      id: bookmarks.id,
      title: bookmarks.title,
    })
    .from(bookmarks);
  const namesByBid = await loadEntityNames("bookmark", rows.map(row => row.id));

  const links: { bookmarkId: string;
    locationId: string; }[] = [];
  for (const row of rows) {
    const titles = [row.title, ...(namesByBid.get(row.id) ?? []).map(n => n.value)];
    for (const locationId of matchLocationIdsByTitle(titles, allLocations)) {
      links.push({
        bookmarkId: row.id,
        locationId,
      });
    }
  }

  if (links.length === 0) {
    return {
      scanned: rows.length,
      updated: 0,
      tagsApplied: 0,
    };
  }

  const inserted = await db
    .insert(bookmarkLocations)
    .values(links)
    .onConflictDoNothing()
    .returning({
      bookmarkId: bookmarkLocations.bookmarkId,
    });
  if (inserted.length > 0) invalidateBookmarkCache();
  return {
    scanned: rows.length,
    updated: new Set(inserted.map(link => link.bookmarkId)).size,
    tagsApplied: inserted.length,
  };
}
