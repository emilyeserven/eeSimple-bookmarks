import { and, desc, eq, ilike, inArray, like, ne, or } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkUrlDuplicateResult,
  BookmarkUrlSummary,
  BulkUrlUpdate,
  BulkUrlUpdateResult,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  UpdateBookmarkRelationshipsInput,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkDateTimeValues,
  bookmarkNumberValues,
  bookmarkRelationships,
  bookmarks,
  type BookmarkRow,
  bookmarkTags,
  relationshipTypes,
} from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { getBookmarkImageRow } from "@/services/bookmarkImages";
import {
  captureChannelAvatar,
  captureWebsiteFavicon,
  captureYouTubeThumbnail,
  channelHintFrom,
  getChannelCategoryId,
  getChannelMediaTypeId,
  getChannelTagIds,
  resolveYouTubeMeta,
  videoMediaTypeId,
  withDatePosted,
  withRuntime,
  ytLog,
} from "@/services/bookmarkEnrichment";
import { hydrateBookmarkRows } from "@/services/bookmarkHydration";
import {
  linkTags,
  recomputeCalculatedValues,
  setBooleanValues,
  setDateTimeValues,
  setNumberValues,
} from "@/services/bookmarkWrites";
import { ensureDefaultCategory } from "@/services/categories";
import { getDescendantIds } from "@/services/tags";
import { ensureWebsiteForUrl, getWebsiteByAnyDomain, normalizeDomain } from "@/services/websites";
import { ensureYouTubeChannel } from "@/services/youtubeChannels";

/** Thrown when a create/update would collide with an existing bookmark's URL. */
export class DuplicateUrlError extends Error {
  constructor(url: string) {
    super(`A bookmark with this URL already exists: ${url}`);
    this.name = "DuplicateUrlError";
  }
}

/** List bookmarks, optionally filtered to the union of the given tags and their subtrees. */
export async function listBookmarks(filterTagIds?: string[]): Promise<Bookmark[]> {
  let allowedIds: Set<string> | null = null;
  if (filterTagIds && filterTagIds.length > 0) {
    const subtrees = await Promise.all(filterTagIds.map(id => getDescendantIds(id)));
    const allTagIds = [...new Set(subtrees.flatMap(s => [...s]))];
    if (allTagIds.length === 0) return [];
    const links = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
      })
      .from(bookmarkTags)
      .where(inArray(bookmarkTags.tagId, allTagIds));
    allowedIds = new Set(links.map(link => link.bookmarkId));
    if (allowedIds.size === 0) return [];
  }

  const baseRows = await db.select().from(bookmarks).orderBy(desc(bookmarks.createdAt));
  const rows = allowedIds ? baseRows.filter(row => allowedIds.has(row.id)) : baseRows;
  return hydrateBookmarkRows(rows);
}

export async function getBookmark(id: string): Promise<Bookmark | null> {
  const [row] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
  if (!row) return null;
  const [hydrated] = await hydrateBookmarkRows([row]);
  return hydrated ?? null;
}

/**
 * List bookmarks whose URL host equals `domain` (used to find links saved on a shortened domain so
 * they can be bulk-expanded). An `ILIKE` prefilter narrows the scan, then `normalizeDomain` confirms
 * the exact host so a substring like `youtu.be` can't match an unrelated URL.
 */
export async function listBookmarksOnHost(domain: string): Promise<BookmarkUrlSummary[]> {
  const host = domain.trim().replace(/^www\./i, "").toLowerCase();
  if (host.length === 0) return [];
  const rows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(ilike(bookmarks.url, `%${host}%`))
    .orderBy(desc(bookmarks.createdAt));
  return rows.filter(row => normalizeDomain(row.url) === host);
}

/**
 * Apply a batch of URL rewrites (e.g. expanding shortened links). Each item reuses `updateBookmark`
 * so the website / YouTube-channel are re-derived, and preserves the pre-existing original URL (or
 * records the old URL as the original on first change). Per-item failures are reported rather than
 * aborting the batch, so one duplicate doesn't sink the rest.
 */
export async function bulkUpdateBookmarkUrls(items: BulkUrlUpdate[]): Promise<BulkUrlUpdateResult[]> {
  const results: BulkUrlUpdateResult[] = [];
  for (const item of items) {
    const [current] = await db
      .select({
        url: bookmarks.url,
        originalUrl: bookmarks.originalUrl,
      })
      .from(bookmarks)
      .where(eq(bookmarks.id, item.id));
    if (!current) {
      results.push({
        id: item.id,
        status: "not-found",
      });
      continue;
    }
    if (current.url === item.url) {
      results.push({
        id: item.id,
        status: "skipped-unchanged",
      });
      continue;
    }
    try {
      await updateBookmark(item.id, {
        url: item.url,
        // Keep the first-seen original; otherwise record the URL we're replacing.
        originalUrl: current.originalUrl ?? current.url,
      });
      results.push({
        id: item.id,
        status: "applied",
      });
    }
    catch (err) {
      if (err instanceof DuplicateUrlError) {
        results.push({
          id: item.id,
          status: "skipped-duplicate",
          message: err.message,
        });
      }
      else {
        results.push({
          id: item.id,
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  return results;
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const existing = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).where(eq(bookmarks.url, input.url));
  if (existing.length > 0) throw new DuplicateUrlError(input.url);

  const defaultId = await ensureDefaultCategory();
  let categoryId = input.categoryId ?? defaultId;

  // Resolve YouTube metadata once (network) before opening the transaction, then reuse it for the
  // channel, the "Video" media-type default, and the Video Length backfill below.
  const meta = await resolveYouTubeMeta(input.url, "create");
  const channelHint = channelHintFrom(input.youtubeChannel, meta);

  // Load site defaults (category + tags) once before the transaction for reuse below.
  const domain = normalizeDomain(input.url);
  const siteData = domain ? await getWebsiteByAnyDomain(domain) : null;

  // Category precedence: user-provided > channel > website > Default.
  if (channelHint && categoryId === defaultId) {
    const channelCategoryId = await getChannelCategoryId(channelHint.key);
    if (channelCategoryId) categoryId = channelCategoryId;
  }
  if (siteData?.category?.id && categoryId === defaultId) {
    categoryId = siteData.category.id;
  }

  // Tags: union user-provided + website defaults + channel defaults.
  const defaultTagIds: string[] = [...(siteData?.tagIds ?? [])];
  if (channelHint) {
    const channelTagIds = await getChannelTagIds(channelHint.key);
    defaultTagIds.push(...channelTagIds);
  }
  const mergedTagIds = [...new Set([...(input.tagIds ?? []), ...defaultTagIds])];

  // Media-type precedence: user-provided > channel default > website default > "Video" (for YouTube).
  let mediaTypeId = input.mediaTypeId ?? null;
  if (!mediaTypeId && channelHint) {
    mediaTypeId = await getChannelMediaTypeId(channelHint.key);
  }
  if (!mediaTypeId && siteData?.mediaTypeId) {
    mediaTypeId = siteData.mediaTypeId;
  }
  if (meta && !mediaTypeId) {
    const videoId = await videoMediaTypeId();
    if (videoId) {
      mediaTypeId = videoId;
      ytLog("info", "create: applied \"Video\" media type");
    }
    else {
      ytLog("warn", "create: \"video\" media type missing; media type left unset");
    }
  }

  const numberValues = await withRuntime(input.numberValues ?? [], meta, "create");
  const dateTimeValues = await withDatePosted(input.dateTimeValues ?? [], meta, "create");

  const {
    id, websiteId, youtubeChannelId,
  } = await db.transaction(async (tx) => {
    const websiteId = await ensureWebsiteForUrl(tx, input.url, input.websiteSiteName);
    const youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
    const [row] = await tx
      .insert(bookmarks)
      .values({
        url: input.url,
        originalUrl: input.originalUrl ?? null,
        title: input.title,
        description: input.description ?? null,
        newsletterContext: input.newsletterContext ?? null,
        categoryId,
        websiteId,
        mediaTypeId,
        youtubeChannelId,
        newsletterId: input.newsletterId ?? null,
        importId: input.importId ?? null,
        priority: input.priority ?? 0,
      })
      .returning({
        id: bookmarks.id,
      });
    await linkTags(tx, row.id, mergedTagIds);
    await setNumberValues(tx, row.id, numberValues);
    await setBooleanValues(tx, row.id, input.booleanValues);
    await setDateTimeValues(tx, row.id, dateTimeValues);
    await recomputeCalculatedValues(tx, row.id);
    return {
      id: row.id,
      websiteId,
      youtubeChannelId,
    };
  });

  // Auto-capture the YouTube thumbnail after the row exists, before the hydrated re-read so the
  // returned bookmark includes the image. Best-effort: never fails the create.
  if (meta !== null) await captureYouTubeThumbnail(id, "create");
  // Populate the website favicon / channel avatar on first sighting. Fire-and-forget (these don't
  // appear on the bookmark itself), so a new-domain bookmark isn't blocked on the icon fetch; each
  // helper is self-guarded (skips when one already exists) and swallows its own errors.
  void captureWebsiteFavicon(websiteId, "create");
  void captureChannelAvatar(youtubeChannelId, "create");

  // A new bookmark changes what homepage sections / autofill previews match.
  invalidateBookmarkCache();

  // Re-read so callers always get the hydrated shape.
  return (await getBookmark(id))!;
}

export async function updateBookmark(
  id: string,
  input: UpdateBookmarkInput,
): Promise<Bookmark | null> {
  if (input.url !== undefined) {
    const clash = await db
      .select({
        id: bookmarks.id,
      })
      .from(bookmarks)
      .where(and(eq(bookmarks.url, input.url), ne(bookmarks.id, id)));
    if (clash.length > 0) throw new DuplicateUrlError(input.url);
  }

  // When the URL changes, resolve YouTube metadata once and reuse it for the channel, the "Video"
  // media-type default, and the Video Length backfill. A channel-only change still re-resolves the
  // channel from the supplied hint.
  const meta = input.url !== undefined ? await resolveYouTubeMeta(input.url, "update") : null;
  const channelHint
    = input.url !== undefined || input.youtubeChannel !== undefined
      ? channelHintFrom(input.youtubeChannel, meta)
      : undefined;

  // Default the media type to "Video" only when the URL becomes a YouTube video, the caller didn't
  // set a media type, and the bookmark doesn't already have one — never overriding an existing pick.
  let mediaTypeDefault: string | undefined;
  if (meta && input.mediaTypeId === undefined) {
    const [current] = await db
      .select({
        mediaTypeId: bookmarks.mediaTypeId,
      })
      .from(bookmarks)
      .where(eq(bookmarks.id, id));
    if (current && current.mediaTypeId == null) {
      const videoId = await videoMediaTypeId();
      if (videoId) {
        mediaTypeDefault = videoId;
        ytLog("info", "update: applied \"Video\" media type");
      }
      else {
        ytLog("warn", "update: \"video\" media type missing; media type left unset");
      }
    }
  }

  // Backfill Runtime only when the caller is already managing number values (full form submit),
  // so a partial update that doesn't touch properties is left untouched.
  const numberValues = input.numberValues !== undefined
    ? await withRuntime(input.numberValues, meta, "update")
    : undefined;
  const dateTimeValues = input.dateTimeValues !== undefined
    ? await withDatePosted(input.dateTimeValues, meta, "update")
    : undefined;

  // Website / channel ids touched by this update, surfaced from the transaction so the post-commit
  // favicon / avatar capture can run on the resolved entities. `undefined` means "not changed".
  let touchedWebsiteId: string | null | undefined;
  let touchedChannelId: string | null | undefined;

  const found = await db.transaction(async (tx) => {
    const patch: Partial<
      Pick<
        BookmarkRow,
        | "url"
        | "originalUrl"
        | "title"
        | "description"
        | "categoryId"
        | "websiteId"
        | "mediaTypeId"
        | "youtubeChannelId"
        | "priority"
      >
    > = {};
    if (input.url !== undefined) {
      patch.url = input.url;
      // Re-derive the website and YouTube channel whenever the URL changes.
      patch.websiteId = await ensureWebsiteForUrl(tx, input.url);
      patch.youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
      touchedWebsiteId = patch.websiteId;
      touchedChannelId = patch.youtubeChannelId;
    }
    else if (channelHint !== undefined) {
      patch.youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
      touchedChannelId = patch.youtubeChannelId;
    }
    if (input.originalUrl !== undefined) patch.originalUrl = input.originalUrl ?? null;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
    if (input.mediaTypeId !== undefined) patch.mediaTypeId = input.mediaTypeId ?? null;
    else if (mediaTypeDefault !== undefined) patch.mediaTypeId = mediaTypeDefault;
    if (input.priority !== undefined) patch.priority = input.priority;

    if (Object.keys(patch).length > 0) {
      const [row] = await tx.update(bookmarks).set(patch).where(eq(bookmarks.id, id)).returning({
        id: bookmarks.id,
      });
      if (!row) return false;
    }
    else {
      const [row] = await tx.select({
        id: bookmarks.id,
      }).from(bookmarks).where(eq(bookmarks.id, id));
      if (!row) return false;
    }

    if (input.tagIds !== undefined) {
      await tx.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, id));
      await linkTags(tx, id, input.tagIds);
    }
    if (numberValues !== undefined) {
      await tx.delete(bookmarkNumberValues).where(eq(bookmarkNumberValues.bookmarkId, id));
      await setNumberValues(tx, id, numberValues);
    }
    if (input.booleanValues !== undefined) {
      await tx.delete(bookmarkBooleanValues).where(eq(bookmarkBooleanValues.bookmarkId, id));
      await setBooleanValues(tx, id, input.booleanValues);
    }
    if (dateTimeValues !== undefined) {
      await tx.delete(bookmarkDateTimeValues).where(eq(bookmarkDateTimeValues.bookmarkId, id));
      await setDateTimeValues(tx, id, dateTimeValues);
    }
    // Always recompute last: number-value edits ripple into calculate results.
    await recomputeCalculatedValues(tx, id);
    return true;
  });

  // Capture a thumbnail when the URL becomes a YouTube video and there's no image yet — don't
  // clobber a user upload or an earlier capture. Best-effort, before the hydrated re-read.
  if (found && meta !== null) {
    const existingImage = await getBookmarkImageRow(id);
    if (existingImage) {
      ytLog("info", `update: thumbnail skipped (image already present) for ${id}`);
    }
    else {
      await captureYouTubeThumbnail(id, "update");
    }
  }

  // Populate the website favicon / channel avatar on first sighting of a newly-linked entity.
  // Fire-and-forget (see createBookmark); only fires when this update actually (re)resolved them.
  if (found) {
    void captureWebsiteFavicon(touchedWebsiteId ?? null, "update");
    void captureChannelAvatar(touchedChannelId ?? null, "update");
    // Edits to a bookmark's matchable fields change homepage / preview matching.
    invalidateBookmarkCache();
  }

  return found ? getBookmark(id) : null;
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const rows = await db.delete(bookmarks).where(eq(bookmarks.id, id)).returning({
    id: bookmarks.id,
  });
  if (rows.length > 0) invalidateBookmarkCache();
  return rows.length > 0;
}

/**
 * Replace the full set of relationships touching a bookmark. Each entry carries a relationship type
 * and an optional label. For SYMMETRIC types the pair is canonicalized (smaller UUID in `bookmarkAId`)
 * so the edge is stored once; for DIRECTIONAL types the order encodes direction — `bookmarkAId` is the
 * parent and `bookmarkBId` is the child, derived from the entry's `direction` (the OTHER bookmark's
 * role relative to the edited one; defaults to `child`). Self-references and entries referencing an
 * unknown type are silently ignored; duplicate edges collapse. Relationships are matchable data, so
 * the bookmark evaluation cache is invalidated.
 */
export async function updateBookmarkRelationships(
  bookmarkId: string,
  {
    relationships,
  }: UpdateBookmarkRelationshipsInput,
): Promise<void> {
  const entries = relationships.filter(entry => entry.bookmarkId !== bookmarkId);

  // Resolve which referenced types are directional so we know whether to canonicalize the pair.
  const typeIds = [...new Set(entries.map(entry => entry.relationshipTypeId))];
  const directionalById = new Map<string, boolean>();
  if (typeIds.length > 0) {
    const typeRows = await db
      .select({
        id: relationshipTypes.id,
        directional: relationshipTypes.directional,
      })
      .from(relationshipTypes)
      .where(inArray(relationshipTypes.id, typeIds));
    for (const t of typeRows) directionalById.set(t.id, t.directional);
  }

  const seen = new Set<string>();
  const rows: {
    bookmarkAId: string;
    bookmarkBId: string;
    relationshipTypeId: string;
    label: string | null;
  }[] = [];
  for (const entry of entries) {
    const directional = directionalById.get(entry.relationshipTypeId);
    if (directional === undefined) continue; // unknown relationship type — skip
    let bookmarkAId: string;
    let bookmarkBId: string;
    if (directional) {
      // `direction` names the OTHER bookmark's role; the parent is always stored in A.
      if (entry.direction === "parent") {
        bookmarkAId = entry.bookmarkId; // the other bookmark is the parent
        bookmarkBId = bookmarkId;
      }
      else {
        bookmarkAId = bookmarkId; // the edited bookmark is the parent (default)
        bookmarkBId = entry.bookmarkId;
      }
    }
    else {
      [bookmarkAId, bookmarkBId]
        = bookmarkId < entry.bookmarkId
          ? [bookmarkId, entry.bookmarkId]
          : [entry.bookmarkId, bookmarkId];
    }
    const key = `${bookmarkAId}:${bookmarkBId}:${entry.relationshipTypeId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const label = entry.label?.trim();
    rows.push({
      bookmarkAId,
      bookmarkBId,
      relationshipTypeId: entry.relationshipTypeId,
      label: label && label.length > 0 ? label : null,
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(bookmarkRelationships)
      .where(
        or(
          eq(bookmarkRelationships.bookmarkAId, bookmarkId),
          eq(bookmarkRelationships.bookmarkBId, bookmarkId),
        ),
      );
    if (rows.length > 0) {
      await tx.insert(bookmarkRelationships).values(rows);
    }
  });
  invalidateBookmarkCache();
}

/** Check if a URL exactly matches an existing bookmark, or shares the same origin+pathname. */
export async function checkBookmarkUrlDuplicate(url: string): Promise<BookmarkUrlDuplicateResult> {
  const exact = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(eq(bookmarks.url, url))
    .limit(1);
  if (exact.length > 0) return {
    exactMatch: exact[0]!,
    pathMatch: null,
  };

  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return {
      exactMatch: null,
      pathMatch: null,
    };
  }
  const basePath = parsed.origin + parsed.pathname;

  const candidates = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(like(bookmarks.url, `${basePath}%`));

  const pathCandidates = candidates.filter((b) => {
    try {
      const p = new URL(b.url);
      return p.origin + p.pathname === basePath;
    }
    catch { return false; }
  });

  if (pathCandidates.length === 0) return {
    exactMatch: null,
    pathMatch: null,
  };

  // Look up paramRules for this domain so identity-bearing params (e.g. YouTube's ?v= on /watch)
  // are included in the match. Uses getWebsiteByAnyDomain so youtu.be resolves to youtube.com.
  const domain = normalizeDomain(url);
  const website = domain ? await getWebsiteByAnyDomain(domain) : null;

  // Find the most-specific matching rule (longest pathSuffix wins, mirrors urlCleanup applyParamRules).
  const matchingRule = website?.paramRules.length
    ? website.paramRules
      .filter(r => r.pathSuffix === "" || parsed.pathname.endsWith(r.pathSuffix))
      .sort((a, b) => b.pathSuffix.length - a.pathSuffix.length)[0] ?? null
    : null;

  if (!matchingRule) {
    return {
      exactMatch: null,
      pathMatch: pathCandidates[0] ?? null,
    };
  }

  // Only flag a candidate as a path-match when all identity params also match.
  const newParamValues = matchingRule.params.map(p => parsed.searchParams.get(p) ?? "");
  const pathMatch = pathCandidates.find((b) => {
    try {
      const bp = new URL(b.url);
      return matchingRule.params.every((p, i) => (bp.searchParams.get(p) ?? "") === newParamValues[i]);
    }
    catch { return false; }
  }) ?? null;

  return {
    exactMatch: null,
    pathMatch,
  };
}
