import { asc, desc, inArray } from "drizzle-orm";
import type {
  BookmarkBooleanValue,
  BookmarkChoicesValue,
  BookmarkDateTimeValue,
  BookmarkFileValue,
  BookmarkImage,
  BookmarkNumberValue,
  BookmarkProgressValue,
  BookmarkScreenshotSettings,
  BookmarkSectionsValue,
  BookmarkTextValue,
  InstagramReelArchive,
  SectionEntry,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkChoicesValues,
  bookmarkDateTimeValues,
  bookmarkFileValues,
  bookmarkImages,
  bookmarkNumberValues,
  bookmarkProgressValues,
  bookmarkReelArchives,
  bookmarkScreenshots,
  bookmarkSectionsValues,
  bookmarkTextValues,
} from "@/db/schema";
import { bookmarkImageFromRow, bookmarkScreenshotFromRow, bookmarkScreenshotSettingsFromRow } from "@/services/bookmarkImages";
import { bookmarkFileValueFromRow } from "@/services/bookmarkPropertyFiles";
import { reelArchiveFromRow } from "@/services/reelArchive";

/** Load number custom-property values for a set of bookmarks, grouped by bookmark id. */
export async function numberValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkNumberValue[]>> {
  const grouped = new Map<string, BookmarkNumberValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkNumberValues.bookmarkId,
      propertyId: bookmarkNumberValues.propertyId,
      value: bookmarkNumberValues.value,
      valueEnd: bookmarkNumberValues.valueEnd,
    })
    .from(bookmarkNumberValues)
    .where(inArray(bookmarkNumberValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
      valueEnd: row.valueEnd ?? null,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load boolean custom-property values for a set of bookmarks, grouped by bookmark id. */
export async function booleanValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkBooleanValue[]>> {
  const grouped = new Map<string, BookmarkBooleanValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkBooleanValues.bookmarkId,
      propertyId: bookmarkBooleanValues.propertyId,
      value: bookmarkBooleanValues.value,
    })
    .from(bookmarkBooleanValues)
    .where(inArray(bookmarkBooleanValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load date/time custom-property values for a set of bookmarks, grouped by bookmark id. */
export async function dateTimeValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkDateTimeValue[]>> {
  const grouped = new Map<string, BookmarkDateTimeValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkDateTimeValues.bookmarkId,
      propertyId: bookmarkDateTimeValues.propertyId,
      value: bookmarkDateTimeValues.value,
    })
    .from(bookmarkDateTimeValues)
    .where(inArray(bookmarkDateTimeValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load choices custom-property values for a set of bookmarks, grouped by bookmark id. */
export async function choicesValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkChoicesValue[]>> {
  const grouped = new Map<string, BookmarkChoicesValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkChoicesValues.bookmarkId,
      propertyId: bookmarkChoicesValues.propertyId,
      values: bookmarkChoicesValues.values,
    })
    .from(bookmarkChoicesValues)
    .where(inArray(bookmarkChoicesValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      values: row.values as string[],
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load item-in-items custom-property values for a set of bookmarks, grouped by bookmark id. */
export async function progressValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkProgressValue[]>> {
  const grouped = new Map<string, BookmarkProgressValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkProgressValues.bookmarkId,
      propertyId: bookmarkProgressValues.propertyId,
      current: bookmarkProgressValues.current,
      total: bookmarkProgressValues.total,
      textOverride: bookmarkProgressValues.textOverride,
      autoSpace: bookmarkProgressValues.autoSpace,
    })
    .from(bookmarkProgressValues)
    .where(inArray(bookmarkProgressValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      current: row.current,
      total: row.total,
      textOverride: row.textOverride as BookmarkProgressValue["textOverride"],
      autoSpace: row.autoSpace,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load sections custom-property values for a set of bookmarks, grouped by bookmark id. */
export async function sectionsValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkSectionsValue[]>> {
  const grouped = new Map<string, BookmarkSectionsValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkSectionsValues.bookmarkId,
      propertyId: bookmarkSectionsValues.propertyId,
      exhaustive: bookmarkSectionsValues.exhaustive,
      sections: bookmarkSectionsValues.sections,
    })
    .from(bookmarkSectionsValues)
    .where(inArray(bookmarkSectionsValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      exhaustive: row.exhaustive,
      sections: row.sections as SectionEntry[],
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load text custom-property values for a set of bookmarks, grouped by bookmark id. */
export async function textValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkTextValue[]>> {
  const grouped = new Map<string, BookmarkTextValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTextValues.bookmarkId,
      propertyId: bookmarkTextValues.propertyId,
      value: bookmarkTextValues.value,
    })
    .from(bookmarkTextValues)
    .where(inArray(bookmarkTextValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load image/file custom-property values for a set of bookmarks, grouped by bookmark id. */
export async function fileValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkFileValue[]>> {
  const grouped = new Map<string, BookmarkFileValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select()
    .from(bookmarkFileValues)
    .where(inArray(bookmarkFileValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push(bookmarkFileValueFromRow(row));
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/**
 * Load attached images for a set of bookmarks in a single query, keyed by bookmark id. Each value is
 * the bookmark's full image list ordered main-first then by `sortOrder` (a bookmark may hold several).
 */
export async function imagesByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkImage[]>> {
  const byId = new Map<string, BookmarkImage[]>();
  if (bookmarkIds.length === 0) return byId;

  const rows = await db
    .select()
    .from(bookmarkImages)
    .where(inArray(bookmarkImages.bookmarkId, bookmarkIds))
    .orderBy(desc(bookmarkImages.isMain), asc(bookmarkImages.sortOrder), asc(bookmarkImages.createdAt));

  for (const row of rows) {
    const list = byId.get(row.bookmarkId) ?? [];
    list.push(bookmarkImageFromRow(row));
    byId.set(row.bookmarkId, list);
  }
  return byId;
}

/** A hydrated screenshot: the wire image plus the capture settings last used to take it. */
export interface ScreenshotHydration {
  image: BookmarkImage;
  settings: BookmarkScreenshotSettings;
}

/** Load screenshots for a set of bookmarks in a single query, keyed by bookmark id. */
export async function screenshotsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, ScreenshotHydration>> {
  const byId = new Map<string, ScreenshotHydration>();
  if (bookmarkIds.length === 0) return byId;

  const rows = await db
    .select()
    .from(bookmarkScreenshots)
    .where(inArray(bookmarkScreenshots.bookmarkId, bookmarkIds));

  for (const row of rows) {
    byId.set(row.bookmarkId, {
      image: bookmarkScreenshotFromRow(row),
      settings: bookmarkScreenshotSettingsFromRow(row),
    });
  }
  return byId;
}

/** Load archived reels for a set of bookmarks in a single query, keyed by bookmark id. */
export async function reelArchivesByBookmarkId(bookmarkIds: string[]): Promise<Map<string, InstagramReelArchive>> {
  const byId = new Map<string, InstagramReelArchive>();
  if (bookmarkIds.length === 0) return byId;

  const rows = await db
    .select()
    .from(bookmarkReelArchives)
    .where(inArray(bookmarkReelArchives.bookmarkId, bookmarkIds));

  for (const row of rows) {
    byId.set(row.bookmarkId, reelArchiveFromRow(row));
  }
  return byId;
}
