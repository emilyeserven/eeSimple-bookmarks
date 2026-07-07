/**
 * One-time, idempotent boot backfill (#1075) that materializes the media-taxonomy tables into
 * bookmarks + relationship edges — the correctness-trap core of the #1057 Media Property → Media Type
 * reconciliation. Depends on #1070 (media identity promoted onto `bookmarks`, nullable `url`) and
 * #1074 (built-in "Franchise" media type + hub convention), both landed on `main`.
 *
 * For every row of the 7 media tables (`books`, `movies`, `tv_shows`, `episodes`, `albums`,
 * `tracks`, `podcasts`) and every `media_properties` row it creates (or adopts) a bookmark carrying
 * the source's identity/metadata, then copies its polymorphic layers (multilingual names, language
 * usages, genres & moods, locations, gallery images) and album/podcast credits, and finally wires:
 *   - `episodes.tvShowId` / `tracks.albumId` → directional **Parent/child** edges (parent = show/album),
 *   - each media row's `mediaPropertyId` → a **Parent/child** edge under its franchise hub bookmark,
 *   - each `bookmarks.{bookId..podcastId}` FK link → a directional **About** edge (parent = the media
 *     bookmark, child = the referring bookmark — the generic form of the #1057 "Analysis of" case).
 *
 * Load-bearing correctness rules (see the #1075 plan):
 *   1. The bookmark insert, its `migration_source` marker, AND every DB data layer commit in ONE
 *      `db.transaction` — never the own-transaction `set*` services — so a marked bookmark can never
 *      be left missing its layers (which a re-run would skip forever). Images are the sole
 *      best-effort, post-tx exception (object-store round-trips can't be transactional).
 *   2. Edges are inserted directly with `onConflictDoNothing` — never `updateBookmarkRelationships`,
 *      which is a replace-all setter that would wipe pre-existing user edges. Directional
 *      canonicalization: parent → `bookmark_a_id`.
 *   3. The `migration_source` marker gates everything: an already-migrated row is skipped entirely
 *      (no re-insert, no re-copy, no re-edge). Layers are copied only on the INSERT branch, never on
 *      ADOPT (an adopted bookmark already has user-authored layers).
 *   4. Old tables and FK columns are left in place — a later retirement ticket drops them.
 *   5. `invalidateBookmarkCache()` is called once at the very end.
 *
 * Scope boundary: a media FK link created AFTER a media row was migrated (e.g. a user sets `movieId`
 * on a brand-new bookmark next week) is NOT converted on later boots — one-time conversion is the
 * contract, since these FK columns are legacy/slated for retirement.
 */

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  albumGroups,
  albumPeople,
  albums,
  bookmarkRelationships,
  bookmarks,
  books,
  entityNames,
  episodes,
  genreMoodAssignments,
  languageUsages,
  locationAssignments,
  mediaProperties,
  movies,
  podcastGroups,
  podcastPeople,
  podcasts,
  relationshipTypes,
  taxonomyImages,
  tracks,
  tvShows,
} from "@/db/schema";
import { linkGroups, linkLocations, linkPeople, type Tx } from "@/services/bookmarkWrites";
import { addBookmarkImage } from "@/services/bookmarkImages";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { getMediaTypeBySlug } from "@/services/mediaTypes";
import { getObjectBytes, isObjectStoreConfigured } from "@/utils/objectStore";
import { slugify } from "@/utils/slug";

/** The eight source kinds. Also the `entity_names`/`language_usages`/… `ownerType` string for each. */
export type MediaKind
  = | "book" | "movie" | "tvShow" | "episode" | "album" | "track" | "podcast" | "mediaProperty";

/** The subset of `bookmarks` identity columns copied from a media row (all nullable). */
export interface BookmarkIdentity {
  isbn?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  kavitaSeriesId?: number | null;
  kavitaLibraryId?: number | null;
  kavitaSeriesName?: string | null;
  feedUrl?: string | null;
  itunesId?: number | null;
  itunesUrl?: string | null;
  spotifyUrl?: string | null;
  pocketCastsUuid?: string | null;
  pocketCastsUrl?: string | null;
  defaultLinkProvider?: string | null;
}

/** A globally-unique identity used to adopt an existing bookmark instead of creating a duplicate. */
export type StrongIdentity
  = | { column: "plexRatingKey";
    value: string; }
    | { column: "kavitaSeriesId";
      value: number; }
      | { column: "isbn";
        value: string; }
        | { column: "feedUrl";
          value: string; }
          | { column: "itunesId";
            value: number; };

/** A media row normalized into the shape the migration pipeline consumes. */
export interface MediaSource {
  kind: MediaKind;
  /** The polymorphic `ownerType` for this row's source layers, or null (media_properties has none). */
  ownerType: MediaKind | null;
  id: string;
  name: string;
  mediaTypeId: string;
  identity: BookmarkIdentity;
  strongIdentity: StrongIdentity | null;
  mediaPropertyId: string | null;
  /** Directional parent link (episode → show, track → album), or null. */
  parentRef: { kind: MediaKind;
    id: string; } | null;
}

/** One canonical directional edge to insert (`aId` = parent, `bId` = child). */
export interface Edge {
  aId: string;
  bId: string;
  typeId: string;
}

// ---------------------------------------------------------------------------------------------
// Pure helpers (unit-tested directly, no DB access).
// ---------------------------------------------------------------------------------------------

/** The `migration_source` marker for a source row, e.g. `"movie:<uuid>"`. */
export function buildMarkerKey(kind: MediaKind, id: string): string {
  return `${kind}:${id}`;
}

/** Parse a `migration_source` marker back into its kind + id, or null when malformed. */
export function parseMarkerKey(marker: string): { kind: MediaKind;
  id: string; } | null {
  const idx = marker.indexOf(":");
  if (idx <= 0) return null;
  const kind = marker.slice(0, idx) as MediaKind;
  const id = marker.slice(idx + 1);
  if (!id) return null;
  return {
    kind,
    id,
  };
}

/**
 * Order the two endpoints of an edge. For a DIRECTIONAL type the parent is always stored in `aId`
 * (mirrors `updateBookmarkRelationships` in `services/bookmarks.ts`); for a SYMMETRIC type the pair
 * is ordered by UUID string compare so it's stored once. The migration only creates directional
 * edges, but the symmetric branch keeps the helper faithful to the service and unit-testable.
 */
export function canonicalizeEdge(
  parentId: string,
  childId: string,
  directional: boolean,
): { aId: string;
  bId: string; } {
  if (directional) return {
    aId: parentId,
    bId: childId,
  };
  return parentId < childId
    ? {
      aId: parentId,
      bId: childId,
    }
    : {
      aId: childId,
      bId: parentId,
    };
}

/**
 * Pick the single bookmark to adopt from the identity-match candidates. Adopt only when EXACTLY one
 * candidate matches; 0 or an ambiguous 2+ both mean "create a fresh bookmark instead".
 */
export function selectReuseCandidate<T>(candidates: T[]): T | null {
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Build the "fill only what's empty" patch for an ADOPT: for each desired key whose value is set,
 * include it only when the existing row's value for that key is null/undefined. Never overwrites a
 * value the user already has. Pure.
 */
export function computeFillEmptyPatch<T extends object>(
  existing: T,
  desired: Partial<T>,
): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of Object.keys(desired) as (keyof T)[]) {
    const value = desired[key];
    if (value === null || value === undefined) continue;
    if (existing[key] === null || existing[key] === undefined) patch[key] = value;
  }
  return patch;
}

/** The `bookmarks` insert values for a freshly-materialized media bookmark. Pure. */
export function planMediaBookmarkInsert(
  source: MediaSource,
  marker: string,
): { title: string;
  url: null;
  mediaTypeId: string;
  migrationSource: string; } & BookmarkIdentity {
  return {
    title: source.name,
    // Media bookmarks are created by identity/title, not URL (URL-optional per #1070).
    url: null,
    mediaTypeId: source.mediaTypeId,
    migrationSource: marker,
    ...source.identity,
    // Deliberately NOT setting the bookmark's own media FK (bookId/movieId/…) — that would make the
    // media bookmark reference itself and produce a self-About edge in Pass 2.
  };
}

/** Inputs to `desiredEdgesForRow` — every neighbouring bookmark id already resolved via the map. */
export interface DesiredEdgeInputs {
  bookmarkId: string;
  /** Parent from a directional parentRef (show/album), resolved to a bookmark id, or null. */
  parentBookmarkId: string | null;
  /** Franchise hub bookmark id (from `mediaPropertyId`), or null. */
  hubBookmarkId: string | null;
  /** Migrated child bookmark ids when THIS row is a hub/show/album (incoming Parent/child). */
  childBookmarkIds: string[];
  /** Bookmark ids that link this media row via an FK (incoming About links). */
  referrerBookmarkIds: string[];
  parentChildTypeId: string;
  aboutTypeId: string;
}

/**
 * Compute the complete, de-duplicated set of directional edges touching one newly-materialized media
 * bookmark — both its OUTGOING parent links and the INCOMING references to it (the incoming half is
 * what lets a hub/show added on a later boot pick up members migrated earlier). Self-edges are
 * skipped. Pure and idempotent: calling it twice yields an identical set (and every edge is inserted
 * with `onConflictDoNothing`, so it's safe across boots too).
 */
export function desiredEdgesForRow(input: DesiredEdgeInputs): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const push = (parentId: string, childId: string, typeId: string): void => {
    if (parentId === childId) return;
    const {
      aId, bId,
    } = canonicalizeEdge(parentId, childId, true);
    const key = `${aId}:${bId}:${typeId}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({
      aId,
      bId,
      typeId,
    });
  };

  // Outgoing: this row is the child of its show/album (parentRef) and of its franchise hub.
  if (input.parentBookmarkId) push(input.parentBookmarkId, input.bookmarkId, input.parentChildTypeId);
  if (input.hubBookmarkId) push(input.hubBookmarkId, input.bookmarkId, input.parentChildTypeId);
  // Incoming: this row is the parent of its own migrated children (show→episodes, album→tracks,
  // franchise→members) — covers the new-parent / old-child case.
  for (const childId of input.childBookmarkIds) push(input.bookmarkId, childId, input.parentChildTypeId);
  // Incoming About: this media bookmark is the subject (parent); each referrer is the child.
  for (const referrerId of input.referrerBookmarkIds) push(input.bookmarkId, referrerId, input.aboutTypeId);

  return edges;
}

// ---------------------------------------------------------------------------------------------
// DB-backed loaders + the boot step.
// ---------------------------------------------------------------------------------------------

/** The `bookmarks` FK column that links a normal bookmark to each media kind (for About edges). */
const FK_COLUMN = {
  book: bookmarks.bookId,
  movie: bookmarks.movieId,
  tvShow: bookmarks.tvShowId,
  episode: bookmarks.episodeId,
  album: bookmarks.albumId,
  track: bookmarks.trackId,
  podcast: bookmarks.podcastId,
} as const;

/** The `bookmarks` column carrying each strong-identity value (for adopt matching). */
const IDENTITY_COLUMN = {
  plexRatingKey: bookmarks.plexRatingKey,
  kavitaSeriesId: bookmarks.kavitaSeriesId,
  isbn: bookmarks.isbn,
  feedUrl: bookmarks.feedUrl,
  itunesId: bookmarks.itunesId,
} as const;

/** Resolve the media-type id each kind maps to; returns null (aborting the step) if any is missing. */
async function resolveMediaTypeIds(): Promise<Record<MediaKind, string> | null> {
  const slugByKind: Record<MediaKind, string> = {
    book: slugify("Book"),
    movie: slugify("Movie"),
    tvShow: slugify("TV Show"),
    episode: slugify("Episode"),
    album: slugify("Album"),
    track: slugify("Track"),
    podcast: slugify("Podcast"),
    mediaProperty: slugify("Franchise"),
  };
  const out = {} as Record<MediaKind, string>;
  for (const [kind, slug] of Object.entries(slugByKind) as [MediaKind, string][]) {
    const mt = await getMediaTypeBySlug(slug);
    if (!mt) {
      console.warn(`[media-migration] media type "${slug}" not seeded; aborting backfill`);
      return null;
    }
    out[kind] = mt.id;
  }
  return out;
}

/** Resolve a built-in relationship type id by name, or null when it hasn't been seeded yet. */
async function relationshipTypeId(name: string): Promise<string | null> {
  const [row] = await db
    .select({
      id: relationshipTypes.id,
    })
    .from(relationshipTypes)
    .where(eq(relationshipTypes.slug, slugify(name)));
  return row?.id ?? null;
}

/** Load every media row across all 8 source tables, normalized into `MediaSource`. */
async function loadAllSources(typeIds: Record<MediaKind, string>): Promise<MediaSource[]> {
  const out: MediaSource[] = [];

  const plexIdentity = (r: {
    plexRatingKey: string | null;
    plexItemType: string | null;
    plexItemTitle: string | null;
    year: number | null;
    wikidataId: string | null;
    wikipediaLinkEn: string | null;
    wikipediaLinkLocal: string | null;
  }): BookmarkIdentity => ({
    plexRatingKey: r.plexRatingKey,
    plexItemType: r.plexItemType,
    plexItemTitle: r.plexItemTitle,
    year: r.year,
    wikidataId: r.wikidataId,
    wikipediaLinkEn: r.wikipediaLinkEn,
    wikipediaLinkLocal: r.wikipediaLinkLocal,
  });
  const plexStrong = (r: { plexRatingKey: string | null }): StrongIdentity | null =>
    r.plexRatingKey
      ? {
        column: "plexRatingKey",
        value: r.plexRatingKey,
      }
      : null;

  for (const r of await db.select().from(books)) {
    out.push({
      kind: "book",
      ownerType: "book",
      id: r.id,
      name: r.name,
      mediaTypeId: typeIds.book,
      identity: {
        isbn: r.isbn,
        year: r.releaseYear,
        kavitaSeriesId: r.kavitaSeriesId,
        kavitaLibraryId: r.kavitaLibraryId,
        kavitaSeriesName: r.kavitaSeriesName,
      },
      strongIdentity: r.kavitaSeriesId != null
        ? {
          column: "kavitaSeriesId",
          value: r.kavitaSeriesId,
        }
        : (r.isbn
          ? {
            column: "isbn",
            value: r.isbn,
          }
          : null),
      mediaPropertyId: r.mediaPropertyId,
      parentRef: null,
    });
  }
  for (const r of await db.select().from(movies)) {
    out.push({
      kind: "movie",
      ownerType: "movie",
      id: r.id,
      name: r.name,
      mediaTypeId: typeIds.movie,
      identity: plexIdentity(r),
      strongIdentity: plexStrong(r),
      mediaPropertyId: r.mediaPropertyId,
      parentRef: null,
    });
  }
  for (const r of await db.select().from(tvShows)) {
    out.push({
      kind: "tvShow",
      ownerType: "tvShow",
      id: r.id,
      name: r.name,
      mediaTypeId: typeIds.tvShow,
      identity: plexIdentity(r),
      strongIdentity: plexStrong(r),
      mediaPropertyId: r.mediaPropertyId,
      parentRef: null,
    });
  }
  for (const r of await db.select().from(episodes)) {
    out.push({
      kind: "episode",
      ownerType: "episode",
      id: r.id,
      name: r.name,
      mediaTypeId: typeIds.episode,
      identity: plexIdentity(r),
      strongIdentity: plexStrong(r),
      mediaPropertyId: r.mediaPropertyId,
      parentRef: r.tvShowId
        ? {
          kind: "tvShow",
          id: r.tvShowId,
        }
        : null,
    });
  }
  for (const r of await db.select().from(albums)) {
    out.push({
      kind: "album",
      ownerType: "album",
      id: r.id,
      name: r.name,
      mediaTypeId: typeIds.album,
      identity: plexIdentity(r),
      strongIdentity: plexStrong(r),
      mediaPropertyId: r.mediaPropertyId,
      parentRef: null,
    });
  }
  for (const r of await db.select().from(tracks)) {
    out.push({
      kind: "track",
      ownerType: "track",
      id: r.id,
      name: r.name,
      mediaTypeId: typeIds.track,
      identity: plexIdentity(r),
      strongIdentity: plexStrong(r),
      mediaPropertyId: r.mediaPropertyId,
      parentRef: r.albumId
        ? {
          kind: "album",
          id: r.albumId,
        }
        : null,
    });
  }
  for (const r of await db.select().from(podcasts)) {
    out.push({
      kind: "podcast",
      ownerType: "podcast",
      id: r.id,
      name: r.name,
      mediaTypeId: typeIds.podcast,
      identity: {
        feedUrl: r.feedUrl,
        itunesId: r.itunesId,
        itunesUrl: r.itunesUrl,
        spotifyUrl: r.spotifyUrl,
        pocketCastsUuid: r.pocketCastsUuid,
        pocketCastsUrl: r.pocketCastsUrl,
        defaultLinkProvider: r.defaultLinkProvider,
      },
      strongIdentity: r.feedUrl
        ? {
          column: "feedUrl",
          value: r.feedUrl,
        }
        : (r.itunesId != null
          ? {
            column: "itunesId",
            value: r.itunesId,
          }
          : null),
      mediaPropertyId: r.mediaPropertyId,
      parentRef: null,
    });
  }
  for (const r of await db.select().from(mediaProperties)) {
    out.push({
      kind: "mediaProperty",
      ownerType: null,
      id: r.id,
      name: r.name,
      mediaTypeId: typeIds.mediaProperty,
      identity: {},
      strongIdentity: null,
      mediaPropertyId: null,
      parentRef: null,
    });
  }
  return out;
}

/** Find the single existing bookmark to adopt for a source (strong identity, single-match only). */
async function findReuseCandidate(source: MediaSource): Promise<{ id: string } & BookmarkIdentity & { mediaTypeId: string | null } | null> {
  if (!source.strongIdentity) return null;
  const column = IDENTITY_COLUMN[source.strongIdentity.column];
  const rows = await db
    .select({
      id: bookmarks.id,
      mediaTypeId: bookmarks.mediaTypeId,
      isbn: bookmarks.isbn,
      year: bookmarks.year,
      wikidataId: bookmarks.wikidataId,
      wikipediaLinkEn: bookmarks.wikipediaLinkEn,
      wikipediaLinkLocal: bookmarks.wikipediaLinkLocal,
      plexRatingKey: bookmarks.plexRatingKey,
      plexItemType: bookmarks.plexItemType,
      plexItemTitle: bookmarks.plexItemTitle,
      kavitaSeriesId: bookmarks.kavitaSeriesId,
      kavitaLibraryId: bookmarks.kavitaLibraryId,
      kavitaSeriesName: bookmarks.kavitaSeriesName,
      feedUrl: bookmarks.feedUrl,
      itunesId: bookmarks.itunesId,
      itunesUrl: bookmarks.itunesUrl,
      spotifyUrl: bookmarks.spotifyUrl,
      pocketCastsUuid: bookmarks.pocketCastsUuid,
      pocketCastsUrl: bookmarks.pocketCastsUrl,
      defaultLinkProvider: bookmarks.defaultLinkProvider,
    })
    .from(bookmarks)
    // A strong identity (Plex rating key / Kavita series / ISBN / feed / iTunes id) is globally unique
    // to the item, so it alone is a safe adopt key — no media-type guard (an existing pre-#1070 media
    // bookmark predates the fine-grained Movie/Album/… types and would carry a coarse type or none).
    .where(and(eq(column, source.strongIdentity.value), isNull(bookmarks.migrationSource)));
  return selectReuseCandidate(rows);
}

/** Copy a media row's source layers into its bookmark, INSIDE the given transaction (atomic). */
async function copyLayers(tx: Tx, source: MediaSource, bookmarkId: string): Promise<void> {
  if (!source.ownerType) return; // media_properties has no polymorphic layers.
  const ownerType = source.ownerType;

  const names = await db.select().from(entityNames)
    .where(and(eq(entityNames.ownerType, ownerType), eq(entityNames.ownerId, source.id)));
  if (names.length > 0) {
    await tx.insert(entityNames).values(names.map(n => ({
      ownerType: "bookmark",
      ownerId: bookmarkId,
      languageId: n.languageId,
      value: n.value,
      isPrimary: n.isPrimary,
      sortOrder: n.sortOrder,
    })));
  }

  const langs = await db.select().from(languageUsages)
    .where(and(eq(languageUsages.ownerType, ownerType), eq(languageUsages.ownerId, source.id)));
  if (langs.length > 0) {
    await tx.insert(languageUsages).values(langs.map(l => ({
      ownerType: "bookmark",
      ownerId: bookmarkId,
      languageId: l.languageId,
      usageLevelId: l.usageLevelId,
      translationSourceId: l.translationSourceId,
      note: l.note,
      sortOrder: l.sortOrder,
    })));
  }

  const genres = await db.select({
    genreMoodId: genreMoodAssignments.genreMoodId,
  }).from(genreMoodAssignments)
    .where(and(eq(genreMoodAssignments.ownerType, ownerType), eq(genreMoodAssignments.ownerId, source.id)));
  if (genres.length > 0) {
    await tx.insert(genreMoodAssignments).values(genres.map(g => ({
      genreMoodId: g.genreMoodId,
      ownerType: "bookmark",
      ownerId: bookmarkId,
    })));
  }

  const locs = await db.select({
    locationId: locationAssignments.locationId,
  }).from(locationAssignments)
    .where(and(eq(locationAssignments.ownerType, ownerType), eq(locationAssignments.ownerId, source.id)));
  await linkLocations(tx, bookmarkId, locs.map(l => l.locationId));

  if (source.kind === "album") {
    const people = await db.select({
      personId: albumPeople.personId,
    }).from(albumPeople).where(eq(albumPeople.albumId, source.id));
    const grps = await db.select({
      groupId: albumGroups.groupId,
    }).from(albumGroups).where(eq(albumGroups.albumId, source.id));
    await linkPeople(tx, bookmarkId, people.map(p => p.personId));
    await linkGroups(tx, bookmarkId, grps.map(g => g.groupId));
  }
  else if (source.kind === "podcast") {
    const people = await db.select({
      personId: podcastPeople.personId,
    }).from(podcastPeople).where(eq(podcastPeople.podcastId, source.id));
    const grps = await db.select({
      groupId: podcastGroups.groupId,
    }).from(podcastGroups).where(eq(podcastGroups.podcastId, source.id));
    await linkPeople(tx, bookmarkId, people.map(p => p.personId));
    await linkGroups(tx, bookmarkId, grps.map(g => g.groupId));
  }
}

/** Copy a media row's gallery images into `bookmark_images` (best-effort, after the tx). */
async function copyImages(source: MediaSource, bookmarkId: string): Promise<number> {
  if (!source.ownerType || !isObjectStoreConfigured()) return 0;
  const imgs = await db.select().from(taxonomyImages)
    .where(and(eq(taxonomyImages.ownerType, source.ownerType), eq(taxonomyImages.ownerId, source.id)))
    .orderBy(taxonomyImages.sortOrder);
  let copied = 0;
  for (const img of imgs) {
    const bytes = await getObjectBytes(img.objectKey);
    if (!bytes) continue;
    const result = await addBookmarkImage(bookmarkId, bytes, "upload", {
      setMain: img.isMain,
    });
    if (typeof result !== "string") copied += 1;
    else if (result === "too_many") break;
  }
  return copied;
}

interface MigrationCounts {
  inserted: number;
  adopted: number;
  edges: number;
  imagesCopied: number;
  failedRows: number;
  skippedBlank: number;
}

/**
 * The boot step. Idempotent: a re-run inserts/adopts/edges nothing (all logged counts are zero on the
 * second boot). See the module doc block for the correctness rules it upholds.
 */
export async function backfillMediaTaxonomiesIntoBookmarks(): Promise<void> {
  const typeIds = await resolveMediaTypeIds();
  if (!typeIds) return;
  const parentChildTypeId = await relationshipTypeId("Parent/child");
  const aboutTypeId = await relationshipTypeId("About");
  if (!parentChildTypeId || !aboutTypeId) {
    console.warn("[media-migration] relationship types not seeded; aborting backfill");
    return;
  }

  // Idempotency map: prior-boot markers included, so Pass 2 can resolve endpoints migrated earlier.
  const migratedMap = new Map<string, string>();
  const markerRows = await db
    .select({
      id: bookmarks.id,
      migrationSource: bookmarks.migrationSource,
    })
    .from(bookmarks);
  for (const row of markerRows) {
    if (row.migrationSource) migratedMap.set(row.migrationSource, row.id);
  }

  const allSources = await loadAllSources(typeIds);
  const childrenByParentKey = new Map<string, MediaSource[]>();
  const childrenByMpId = new Map<string, MediaSource[]>();
  const pushInto = (map: Map<string, MediaSource[]>, key: string, value: MediaSource): void => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };
  for (const s of allSources) {
    if (s.parentRef) pushInto(childrenByParentKey, buildMarkerKey(s.parentRef.kind, s.parentRef.id), s);
    if (s.mediaPropertyId) pushInto(childrenByMpId, s.mediaPropertyId, s);
  }

  const counts: MigrationCounts = {
    inserted: 0,
    adopted: 0,
    edges: 0,
    imagesCopied: 0,
    failedRows: 0,
    skippedBlank: 0,
  };
  const createdThisRun: MediaSource[] = [];

  // Pass 1 — create-or-adopt one bookmark per source row (each row isolated so one failure is skipped).
  for (const source of allSources) {
    const marker = buildMarkerKey(source.kind, source.id);
    if (migratedMap.has(marker)) continue;
    if (source.name.trim().length === 0) {
      counts.skippedBlank += 1;
      console.warn(`[media-migration] skipping ${marker}: blank name`);
      continue;
    }
    try {
      const candidate = await findReuseCandidate(source);
      let bookmarkId: string;
      if (candidate) {
        const patch = computeFillEmptyPatch(
          candidate,
          {
            ...source.identity,
            mediaTypeId: source.mediaTypeId,
          } as Partial<typeof candidate>,
        );
        await db.transaction(async (tx) => {
          await tx.update(bookmarks).set({
            ...patch,
            migrationSource: marker,
          }).where(eq(bookmarks.id, candidate.id));
        });
        bookmarkId = candidate.id;
        counts.adopted += 1;
      }
      else {
        bookmarkId = await db.transaction(async (tx) => {
          const [row] = await tx.insert(bookmarks).values(planMediaBookmarkInsert(source, marker)).returning({
            id: bookmarks.id,
          });
          await copyLayers(tx, source, row!.id);
          return row!.id;
        });
        counts.inserted += 1;
        counts.imagesCopied += await copyImages(source, bookmarkId);
      }
      migratedMap.set(marker, bookmarkId);
      createdThisRun.push(source);
    }
    catch (err) {
      counts.failedRows += 1;
      console.warn(`[media-migration] failed to migrate ${marker}:`, err);
    }
  }

  // Pass 2 — wire edges for rows created this run (both outgoing FK and incoming references).
  for (const source of createdThisRun) {
    const marker = buildMarkerKey(source.kind, source.id);
    const bookmarkId = migratedMap.get(marker);
    if (!bookmarkId) continue;
    try {
      const parentBookmarkId = source.parentRef
        ? migratedMap.get(buildMarkerKey(source.parentRef.kind, source.parentRef.id)) ?? null
        : null;
      const hubBookmarkId = source.mediaPropertyId
        ? migratedMap.get(buildMarkerKey("mediaProperty", source.mediaPropertyId)) ?? null
        : null;

      // Incoming Parent/child: this row's migrated children (show→episodes, album→tracks, franchise→members).
      const childSources = source.kind === "mediaProperty"
        ? childrenByMpId.get(source.id) ?? []
        : childrenByParentKey.get(marker) ?? [];
      const childBookmarkIds = childSources
        .map(c => migratedMap.get(buildMarkerKey(c.kind, c.id)))
        .filter((id): id is string => id !== undefined);

      // Incoming About: normal bookmarks that link this media row via its FK column.
      let referrerBookmarkIds: string[] = [];
      const fkColumn = source.kind === "mediaProperty" ? null : FK_COLUMN[source.kind];
      if (fkColumn) {
        const referrers = await db.select({
          id: bookmarks.id,
        }).from(bookmarks).where(eq(fkColumn, source.id));
        referrerBookmarkIds = referrers.map(r => r.id);
      }

      const edges = desiredEdgesForRow({
        bookmarkId,
        parentBookmarkId,
        hubBookmarkId,
        childBookmarkIds,
        referrerBookmarkIds,
        parentChildTypeId,
        aboutTypeId,
      });
      if (edges.length > 0) {
        await db.insert(bookmarkRelationships).values(edges.map(e => ({
          bookmarkAId: e.aId,
          bookmarkBId: e.bId,
          relationshipTypeId: e.typeId,
        }))).onConflictDoNothing();
        counts.edges += edges.length;
      }
    }
    catch (err) {
      counts.failedRows += 1;
      console.warn(`[media-migration] failed to wire edges for ${marker}:`, err);
    }
  }

  if (counts.inserted + counts.adopted + counts.edges > 0) invalidateBookmarkCache();
  console.info(
    `[media-migration] inserted=${counts.inserted} adopted=${counts.adopted} edges=${counts.edges} `
    + `images=${counts.imagesCopied} skippedBlank=${counts.skippedBlank} failed=${counts.failedRows}`,
  );
}
