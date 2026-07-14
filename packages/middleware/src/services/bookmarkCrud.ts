import { and, desc, eq, inArray, ne, or } from "drizzle-orm";
import type {
  Bookmark,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  UpdateBookmarkRelationshipsInput,
} from "@eesimple/types";
import { db } from "@/db";
import { deriveDetectedPrimaryNames, setEntityNames } from "@/services/entityNames";
import { deleteLanguageUsagesForOwner, setLanguageUsages } from "@/services/languageUsages";
import {
  bookmarkPeople,
  bookmarkGroups,
  bookmarkBooleanValues,
  bookmarkChoicesValues,
  bookmarkDateTimeValues,
  bookmarkLocations,
  bookmarkNumberValues,
  bookmarkProgressValues,
  bookmarkSectionsValues,
  bookmarkTextValues,
  bookmarkRelationships,
  bookmarks,
  type BookmarkRow,
  bookmarkTags,
  taxonomyAssignments,
  relationshipTypes,
} from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { cleanupBookmarkEntityNames, cleanupGenreMoodAssignments } from "@/services/bookmarkCleanup";
import { DuplicateUrlError } from "@/services/bookmarkErrors";
import { getBookmarkImageRow } from "@/services/bookmarkImages";
import {
  captureChannelAvatar,
  captureWebsiteFavicon,
  captureYouTubeThumbnail,
  channelHintFrom,
  getChannelCategoryId,
  getChannelTagIds,
  resolveYouTubeMeta,
  videoMediaTypeId,
  withContentStatusDefault,
  withDatePosted,
  withRuntime,
  ytLog,
} from "@/services/bookmarkEnrichment";
import { hydrateBookmarkRows } from "@/services/bookmarkHydration";
import { getGenreMoodsTaxonomyId } from "@/services/taxonomies";
import {
  linkGenreMoods,
  linkPeople,
  linkGroups,
  linkLocations,
  linkTags,
  recomputeCalculatedValues,
  recomputeDerivedProgress,
  setBooleanValues,
  setBookmarkLocationBlacklist,
  setBookmarkTagBlacklist,
  setChoicesValues,
  setDateTimeValues,
  setNumberValues,
  setProgressValues,
  setSectionsValues,
  setTextValues,
  type Tx,
} from "@/services/bookmarkWrites";
import { getAutomationSettings } from "@/services/appSettings";
import { resolveDefaultCategoryId } from "@/services/categories";
import { getDescendantIds, listTagNames, matchTagIdsByTitle } from "@/services/tags";
import { listLocationNames, matchLocationIdsByTitle } from "@/services/locations";
import { ensureWebsiteForUrl, getWebsiteByAnyDomain, normalizeDomain } from "@/services/websites";
import { ensureYouTubeChannel } from "@/services/youtubeChannels";

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

type ChannelHint = ReturnType<typeof channelHintFrom>;
type SiteData = Awaited<ReturnType<typeof getWebsiteByAnyDomain>>;
type YouTubeMeta = Awaited<ReturnType<typeof resolveYouTubeMeta>>;

/** Category precedence: user-provided > channel default > website default > Default. */
async function resolveCreateCategoryId(
  input: CreateBookmarkInput,
  defaultId: string,
  channelHint: ChannelHint,
  siteData: SiteData,
): Promise<string> {
  let categoryId = input.categoryId ?? defaultId;
  if (channelHint && categoryId === defaultId) {
    const channelCategoryId = await getChannelCategoryId(channelHint.key);
    if (channelCategoryId) categoryId = channelCategoryId;
  }
  if (siteData?.category?.id && categoryId === defaultId) {
    categoryId = siteData.category.id;
  }
  return categoryId;
}

/** Tag ids matched from the bookmark title (+ any other supplied names), when the "auto-tag from title" automation is enabled. */
async function titleMatchTagIds(title: string, extraTitles: string[]): Promise<string[]> {
  if (!title.trim() && !extraTitles.some(value => value.trim())) return [];
  const {
    autoApplyTitleTags,
  } = await getAutomationSettings();
  if (!autoApplyTitleTags) return [];
  const allTags = await listTagNames();
  return matchTagIdsByTitle([title, ...extraTitles], allTags);
}

/** Tags: union of user-provided + website defaults + channel defaults + title matches (deduped). */
async function mergeCreateTagIds(
  input: CreateBookmarkInput,
  channelHint: ChannelHint,
  siteData: SiteData,
): Promise<string[]> {
  const defaultTagIds: string[] = [...(siteData?.tagIds ?? [])];
  if (channelHint) {
    const channelTagIds = await getChannelTagIds(channelHint.key);
    defaultTagIds.push(...channelTagIds);
  }
  const titleTagIds = await titleMatchTagIds(input.title, (input.names ?? []).map(entry => entry.value));
  return [...new Set([...(input.tagIds ?? []), ...defaultTagIds, ...titleTagIds])];
}

/** Location ids matched from the bookmark title (+ any other supplied names), when the "auto-tag from title" automation is on. */
async function titleMatchLocationIds(title: string, extraTitles: string[]): Promise<string[]> {
  if (!title.trim() && !extraTitles.some(value => value.trim())) return [];
  const {
    autoApplyTitleLocations,
  } = await getAutomationSettings();
  if (!autoApplyTitleLocations) return [];
  const allLocations = await listLocationNames();
  return matchLocationIdsByTitle([title, ...extraTitles], allLocations);
}

/** Locations: union of user-provided + title matches (deduped). */
async function mergeCreateLocationIds(input: CreateBookmarkInput): Promise<string[]> {
  const titleLocationIds = await titleMatchLocationIds(input.title, (input.names ?? []).map(entry => entry.value));
  return [...new Set([...(input.locationIds ?? []), ...titleLocationIds])];
}

/** Media-type precedence: user-provided > website default > "Video" (YouTube). */
async function resolveCreateMediaTypeId(
  input: CreateBookmarkInput,
  siteData: SiteData,
  meta: YouTubeMeta,
): Promise<string | null> {
  let mediaTypeId = input.mediaTypeId ?? null;
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
  return mediaTypeId;
}

/** The FK columns of a new bookmark row resolved before/inside the create transaction. */
interface ResolvedBookmarkRefs {
  categoryId: string | null;
  websiteId: string | null;
  mediaTypeId: string | null;
  youtubeChannelId: string | null;
}

/** The scalar (text/number) columns of a new bookmark row, coalescing absent inputs to null. */
function newBookmarkScalarColumns(input: CreateBookmarkInput) {
  return {
    url: input.url ?? null,
    originalUrl: input.originalUrl ?? null,
    secondaryUrl: input.secondaryUrl ?? null,
    title: input.title,
    description: input.description ?? null,
    newsletterId: input.newsletterId ?? null,
    importId: input.importId ?? null,
    priority: input.priority ?? 0,
    imageDisplayPreference: input.imageDisplayPreference ?? null,
  };
}

/**
 * The media-identity columns of a new bookmark row (Kavita/Plex/ISBN/podcast-feed/…). Media links
 * are `About` relationship edges (see #1076), not FKs.
 */
function newBookmarkMediaColumns(input: CreateBookmarkInput) {
  return {
    kavitaSeriesId: input.kavitaSeriesId ?? null,
    kavitaLibraryId: input.kavitaLibraryId ?? null,
    kavitaSeriesName: input.kavitaSeriesName ?? null,
    plexRatingKey: input.plexRatingKey ?? null,
    plexItemType: input.plexItemType ?? null,
    plexItemTitle: input.plexItemTitle ?? null,
    isbn: input.isbn ?? null,
    year: input.year ?? null,
    wikidataId: input.wikidataId ?? null,
    wikipediaLinkEn: input.wikipediaLinkEn ?? null,
    wikipediaLinkLocal: input.wikipediaLinkLocal ?? null,
    feedUrl: input.feedUrl ?? null,
    itunesId: input.itunesId ?? null,
    itunesUrl: input.itunesUrl ?? null,
    spotifyUrl: input.spotifyUrl ?? null,
    pocketCastsUuid: input.pocketCastsUuid ?? null,
    pocketCastsUrl: input.pocketCastsUrl ?? null,
    defaultLinkProvider: input.defaultLinkProvider ?? null,
  };
}

/** The full `bookmarks` insert row: scalar + media columns merged with the resolved FK refs. */
function buildBookmarkInsertValues(input: CreateBookmarkInput, refs: ResolvedBookmarkRefs) {
  return {
    ...newBookmarkScalarColumns(input),
    ...newBookmarkMediaColumns(input),
    categoryId: refs.categoryId,
    websiteId: refs.websiteId,
    mediaTypeId: refs.mediaTypeId,
    youtubeChannelId: refs.youtubeChannelId,
  };
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  if (input.url) {
    const existing = await db.select({
      id: bookmarks.id,
    }).from(bookmarks).where(eq(bookmarks.url, input.url));
    if (existing.length > 0) throw new DuplicateUrlError(input.url);
  }

  const defaultId = await resolveDefaultCategoryId();

  // Resolve YouTube metadata once (network) before opening the transaction, then reuse it for the
  // channel, the "Video" media-type default, and the Video Length backfill below.
  const meta = await resolveYouTubeMeta(input.url ?? "", "create");
  const channelHint = channelHintFrom(input.youtubeChannel, meta);

  // Load site defaults (category + tags) once before the transaction for reuse below.
  const domain = input.url ? normalizeDomain(input.url) : null;
  const siteData = domain ? await getWebsiteByAnyDomain(domain) : null;

  const categoryId = await resolveCreateCategoryId(input, defaultId, channelHint, siteData);
  const mergedTagIds = await mergeCreateTagIds(input, channelHint, siteData);
  const mergedLocationIds = await mergeCreateLocationIds(input);
  const mediaTypeId = await resolveCreateMediaTypeId(input, siteData, meta);

  const numberValues = await withRuntime(input.numberValues ?? [], meta, "create");
  const dateTimeValues = await withDatePosted(input.dateTimeValues ?? [], meta, "create");
  const choicesValues = await withContentStatusDefault(input.choicesValues ?? []);
  // G&M is a taxonomy now; resolve its id once so `linkGenreMoods` can write taxonomy_assignments.
  const genreMoodsTaxonomyId = await getGenreMoodsTaxonomyId();

  const {
    id, websiteId, youtubeChannelId,
  } = await db.transaction(async (tx) => {
    const websiteId = input.url ? await ensureWebsiteForUrl(tx, input.url, input.websiteSiteName) : null;
    const youtubeChannelId = input.youtubeChannelId !== undefined
      ? input.youtubeChannelId
      : (channelHint ? await ensureYouTubeChannel(tx, channelHint) : null);
    const [row] = await tx
      .insert(bookmarks)
      .values(buildBookmarkInsertValues(input, {
        categoryId,
        websiteId,
        mediaTypeId,
        youtubeChannelId,
      }))
      .returning({
        id: bookmarks.id,
      });
    await linkTags(tx, row.id, mergedTagIds);
    await linkGenreMoods(tx, row.id, input.genreMoodIds, genreMoodsTaxonomyId);
    await linkLocations(tx, row.id, mergedLocationIds, input.locationRelationByLocationId);
    if (input.blacklistedTagIds?.length) {
      await setBookmarkTagBlacklist(tx, row.id, input.blacklistedTagIds);
    }
    if (input.blacklistedLocationIds?.length) {
      await setBookmarkLocationBlacklist(tx, row.id, input.blacklistedLocationIds);
    }
    await linkPeople(tx, row.id, input.personIds);
    await linkGroups(tx, row.id, input.groupIds);
    await setNumberValues(tx, row.id, numberValues);
    await setBooleanValues(tx, row.id, input.booleanValues);
    await setDateTimeValues(tx, row.id, dateTimeValues);
    await setChoicesValues(tx, row.id, choicesValues);
    await setProgressValues(tx, row.id, input.progressValues);
    await setSectionsValues(tx, row.id, input.sectionsValues);
    await setTextValues(tx, row.id, input.textValues);
    await recomputeCalculatedValues(tx, row.id);
    // After progress + sections are written, so a sections-derived Progress wins over a manual value.
    await recomputeDerivedProgress(tx, row.id);
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
  // Auto-detected language (scan/ISBN), attached as ordinary language_usages rows.
  if (input.languageUsages?.length) await setLanguageUsages("bookmark", id, input.languageUsages);
  // Multilingual names: use the caller's explicit set when provided, else derive the primary name
  // from the title's script — the site's detected language (#985) disambiguates Han-only titles
  // ahead of the global hanScriptLanguage default.
  const nameEntries = input.names?.length
    ? input.names
    : await deriveDetectedPrimaryNames(input.title, input.siteLanguageCode);
  if (nameEntries.length) await setEntityNames("bookmark", id, nameEntries);

  // A new bookmark changes what homepage sections / autofill previews match.
  invalidateBookmarkCache();

  // Re-read so callers always get the hydrated shape.
  return (await getBookmark(id))!;
}

/** The scalar (non-URL-derived) bookmark columns an update may touch. */
type ScalarBookmarkPatch = Partial<
  Pick<BookmarkRow, "originalUrl" | "secondaryUrl" | "title" | "description" | "categoryId" | "mediaTypeId" | "youtubeChannelId" | "kavitaSeriesId" | "kavitaLibraryId" | "kavitaSeriesName" | "plexRatingKey" | "plexItemType" | "plexItemTitle" | "isbn" | "year" | "wikidataId" | "wikipediaLinkEn" | "wikipediaLinkLocal" | "feedUrl" | "itunesId" | "itunesUrl" | "spotifyUrl" | "pocketCastsUuid" | "pocketCastsUrl" | "defaultLinkProvider" | "priority" | "imageDisplayPreference">
>;

/**
 * Nullable scalar columns copied through verbatim when the caller provided the field, coalescing an
 * explicit `null`/`undefined` value to `null` (an omitted key leaves the column untouched).
 */
const NULLABLE_SCALAR_FIELDS = [
  "originalUrl", "secondaryUrl", "description", "mediaTypeId", "youtubeChannelId", "kavitaSeriesId",
  "kavitaLibraryId", "kavitaSeriesName", "plexRatingKey", "plexItemType", "plexItemTitle", "isbn",
  "year", "wikidataId", "wikipediaLinkEn", "wikipediaLinkLocal", "feedUrl", "itunesId", "itunesUrl",
  "spotifyUrl", "pocketCastsUuid", "pocketCastsUrl", "defaultLinkProvider", "imageDisplayPreference",
] as const satisfies readonly (keyof ScalarBookmarkPatch)[];

/** Scalar columns copied through exactly as given (no null-coalescing) when the caller set them. */
const PASSTHROUGH_SCALAR_FIELDS = [
  "title", "categoryId", "priority",
] as const satisfies readonly (keyof ScalarBookmarkPatch)[];

/**
 * The straight scalar-column part of an update's patch (everything except the URL-derived
 * `url`/`websiteId`/`youtubeChannelId`, which need async resolution). Pure, so it is unit-testable.
 * `mediaTypeDefault` is applied only when the caller did not set a media type.
 */
export function scalarBookmarkPatch(
  input: UpdateBookmarkInput,
  mediaTypeDefault: string | undefined,
): ScalarBookmarkPatch {
  const patch = {} as Record<string, unknown>;
  for (const field of NULLABLE_SCALAR_FIELDS) {
    const value = input[field];
    if (value !== undefined) patch[field] = value ?? null;
  }
  for (const field of PASSTHROUGH_SCALAR_FIELDS) {
    const value = input[field];
    if (value !== undefined) patch[field] = value;
  }
  // The "Video" media-type default fills in only when the caller left the media type unset entirely.
  if (input.mediaTypeId === undefined && mediaTypeDefault !== undefined) {
    patch.mediaTypeId = mediaTypeDefault;
  }
  return patch as ScalarBookmarkPatch;
}

/**
 * Resolve the "Video" media-type default for an update: only when the URL became a YouTube video, the
 * caller didn't set a media type, and the bookmark doesn't already have one (never overrides a pick).
 */
async function resolveVideoMediaTypeDefault(
  id: string,
  meta: Awaited<ReturnType<typeof resolveYouTubeMeta>>,
  input: UpdateBookmarkInput,
): Promise<string | undefined> {
  if (!meta || input.mediaTypeId !== undefined) return undefined;
  const [current] = await db
    .select({
      mediaTypeId: bookmarks.mediaTypeId,
    })
    .from(bookmarks)
    .where(eq(bookmarks.id, id));
  if (!current || current.mediaTypeId != null) return undefined;
  const videoId = await videoMediaTypeId();
  if (videoId) {
    ytLog("info", "update: applied \"Video\" media type");
    return videoId;
  }
  ytLog("warn", "update: \"video\" media type missing; media type left unset");
  return undefined;
}

/** Replace the tag / number / boolean / date-time value sets a bookmark update touches. */
async function applyBookmarkValueUpdates(
  tx: Tx,
  id: string,
  input: UpdateBookmarkInput,
  resolved: {
    numberValues?: UpdateBookmarkInput["numberValues"];
    dateTimeValues?: UpdateBookmarkInput["dateTimeValues"];
  },
): Promise<void> {
  if (input.tagIds !== undefined) {
    await tx.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, id));
    await linkTags(tx, id, input.tagIds);
  }
  if (input.genreMoodIds !== undefined) {
    // G&M is now a taxonomy: replace this bookmark's G&M assignments (scoped to the G&M taxonomy so
    // other taxonomies' assignments on the bookmark are untouched), then re-link.
    const genreMoodsTaxonomyId = await getGenreMoodsTaxonomyId();
    if (genreMoodsTaxonomyId) {
      await tx.delete(taxonomyAssignments).where(and(
        eq(taxonomyAssignments.taxonomyId, genreMoodsTaxonomyId),
        eq(taxonomyAssignments.ownerType, "bookmark"),
        eq(taxonomyAssignments.ownerId, id),
      ));
    }
    await linkGenreMoods(tx, id, input.genreMoodIds, genreMoodsTaxonomyId);
  }
  if (input.locationIds !== undefined) {
    await tx.delete(bookmarkLocations).where(eq(bookmarkLocations.bookmarkId, id));
    await linkLocations(tx, id, input.locationIds, input.locationRelationByLocationId);
  }
  if (input.blacklistedTagIds !== undefined) {
    await setBookmarkTagBlacklist(tx, id, input.blacklistedTagIds);
  }
  if (input.personIds !== undefined) {
    await tx.delete(bookmarkPeople).where(eq(bookmarkPeople.bookmarkId, id));
    await linkPeople(tx, id, input.personIds);
  }
  if (input.groupIds !== undefined) {
    await tx.delete(bookmarkGroups).where(eq(bookmarkGroups.bookmarkId, id));
    await linkGroups(tx, id, input.groupIds);
  }
  if (resolved.numberValues !== undefined) {
    await tx.delete(bookmarkNumberValues).where(eq(bookmarkNumberValues.bookmarkId, id));
    await setNumberValues(tx, id, resolved.numberValues);
  }
  if (input.booleanValues !== undefined) {
    await tx.delete(bookmarkBooleanValues).where(eq(bookmarkBooleanValues.bookmarkId, id));
    await setBooleanValues(tx, id, input.booleanValues);
  }
  if (resolved.dateTimeValues !== undefined) {
    await tx.delete(bookmarkDateTimeValues).where(eq(bookmarkDateTimeValues.bookmarkId, id));
    await setDateTimeValues(tx, id, resolved.dateTimeValues);
  }
  if (input.choicesValues !== undefined) {
    await tx.delete(bookmarkChoicesValues).where(eq(bookmarkChoicesValues.bookmarkId, id));
    await setChoicesValues(tx, id, input.choicesValues);
  }
  if (input.progressValues !== undefined) {
    await tx.delete(bookmarkProgressValues).where(eq(bookmarkProgressValues.bookmarkId, id));
    await setProgressValues(tx, id, input.progressValues);
  }
  if (input.sectionsValues !== undefined) {
    await tx.delete(bookmarkSectionsValues).where(eq(bookmarkSectionsValues.bookmarkId, id));
    await setSectionsValues(tx, id, input.sectionsValues);
  }
  if (input.textValues !== undefined) {
    await tx.delete(bookmarkTextValues).where(eq(bookmarkTextValues.bookmarkId, id));
    await setTextValues(tx, id, input.textValues);
  }
}

export async function updateBookmark(
  id: string,
  input: UpdateBookmarkInput,
): Promise<Bookmark | null> {
  if (input.url != null) {
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
  const meta = input.url != null ? await resolveYouTubeMeta(input.url, "update") : null;
  const channelHint
    = input.url !== undefined || input.youtubeChannel !== undefined
      ? channelHintFrom(input.youtubeChannel, meta)
      : undefined;

  // Default the media type to "Video" only when the URL becomes a YouTube video, the caller didn't
  // set a media type, and the bookmark doesn't already have one — never overriding an existing pick.
  const mediaTypeDefault = await resolveVideoMediaTypeDefault(id, meta, input);

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
        | "kavitaSeriesId"
        | "kavitaLibraryId"
        | "kavitaSeriesName"
        | "plexRatingKey"
        | "plexItemType"
        | "plexItemTitle"
        | "priority"
        | "imageDisplayPreference"
        | "updatedAt"
      >
    > = {
      updatedAt: new Date(),
    };
    if (input.url !== undefined) {
      patch.url = input.url ?? null;
      // Re-derive the website and YouTube channel whenever the URL changes.
      patch.websiteId = input.url ? await ensureWebsiteForUrl(tx, input.url) : null;
      patch.youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
      touchedWebsiteId = patch.websiteId;
      touchedChannelId = patch.youtubeChannelId;
    }
    else if (channelHint !== undefined) {
      patch.youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
      touchedChannelId = patch.youtubeChannelId;
    }
    Object.assign(patch, scalarBookmarkPatch(input, mediaTypeDefault));

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

    await applyBookmarkValueUpdates(tx, id, input, {
      numberValues,
      dateTimeValues,
    });
    // Always recompute last: number-value edits ripple into calculate results, and sections edits
    // ripple into a linked derived Progress value.
    await recomputeCalculatedValues(tx, id);
    await recomputeDerivedProgress(tx, id);
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
  if (rows.length > 0) {
    // Polymorphic language-usage rows have no FK on ownerId — clean them up explicitly.
    await deleteLanguageUsagesForOwner("bookmark", id);
    await cleanupGenreMoodAssignments([id]);
    await cleanupBookmarkEntityNames([id]);
    invalidateBookmarkCache();
  }
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

export { DuplicateUrlError } from "@/services/bookmarkErrors";
