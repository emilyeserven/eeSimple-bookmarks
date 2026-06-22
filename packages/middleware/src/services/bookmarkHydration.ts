import { eq, inArray, or } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkFileValue,
  BookmarkImage,
  BookmarkImport,
  BookmarkMediaType,
  BookmarkNewsletter,
  BookmarkNumberValue,
  BookmarkRelationship,
  BookmarkTag,
  BookmarkWebsite,
  BookmarkYouTubeChannel,
  RelationshipRole,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkDateTimeValues,
  bookmarkFileValues,
  bookmarkImages,
  bookmarkNumberValues,
  bookmarkRelationships,
  bookmarks,
  type BookmarkRow,
  bookmarkTags,
  imports,
  mediaTypes,
  newsletters,
  relationshipTypes,
  tags,
  websiteFavicons,
  websites,
  youtubeChannelImages,
  youtubeChannels,
} from "@/db/schema";
import { bookmarkImageFromRow } from "@/services/bookmarkImages";
import { bookmarkFileValueFromRow } from "@/services/bookmarkPropertyFiles";
import { ensureDefaultCategory } from "@/services/categories";
import { slugify } from "@/utils/slug";

/** The hydrated relations that accompany a bookmark row. */
interface BookmarkExtras {
  website: BookmarkWebsite | null;
  mediaType: BookmarkMediaType | null;
  youtubeChannel: BookmarkYouTubeChannel | null;
  newsletter: BookmarkNewsletter | null;
  import: BookmarkImport | null;
  tags: BookmarkTag[];
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
  fileValues: BookmarkFileValue[];
  image: BookmarkImage | null;
  relationships: BookmarkRelationship[];
}

const EMPTY_EXTRAS: BookmarkExtras = {
  website: null,
  mediaType: null,
  youtubeChannel: null,
  newsletter: null,
  import: null,
  tags: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  fileValues: [],
  image: null,
  relationships: [],
};

/** Map a DB row plus its hydrated relations to the shared `Bookmark` wire type. */
function toBookmark(row: BookmarkRow, extras: BookmarkExtras, defaultCategoryId: string): Bookmark {
  return {
    id: row.id,
    url: row.url,
    originalUrl: row.originalUrl,
    title: row.title,
    description: row.description,
    newsletterContext: row.newsletterContext,
    categoryId: row.categoryId ?? defaultCategoryId,
    website: extras.website,
    mediaType: extras.mediaType,
    youtubeChannel: extras.youtubeChannel,
    newsletter: extras.newsletter,
    import: extras.import,
    tags: extras.tags,
    numberValues: extras.numberValues,
    booleanValues: extras.booleanValues,
    dateTimeValues: extras.dateTimeValues,
    fileValues: extras.fileValues,
    relationships: extras.relationships,
    image: extras.image,
    imageAutoGrabError: (row.imageAutoGrabError as "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error" | null) ?? null,
    priority: row.priority,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Load websites for a set of website ids in a single query, keyed by website id. */
async function websitesById(websiteIds: string[]): Promise<Map<string, BookmarkWebsite>> {
  const byId = new Map<string, BookmarkWebsite>();
  if (websiteIds.length === 0) return byId;

  const rows = await db
    .select({
      id: websites.id,
      domain: websites.domain,
      siteName: websites.siteName,
      slug: websites.slug,
      faviconCreatedAt: websiteFavicons.createdAt,
    })
    .from(websites)
    .leftJoin(websiteFavicons, eq(websiteFavicons.websiteId, websites.id))
    .where(inArray(websites.id, websiteIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      domain: row.domain,
      siteName: row.siteName,
      slug: row.slug ?? (row.domain.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-") || "website"),
      imageUrl: row.faviconCreatedAt
        ? `/api/websites/${row.id}/image?v=${new Date(row.faviconCreatedAt).getTime()}`
        : null,
    });
  }
  return byId;
}

/** Load media types for a set of media-type ids in a single query, keyed by media-type id. */
async function mediaTypesById(mediaTypeIds: string[]): Promise<Map<string, BookmarkMediaType>> {
  const byId = new Map<string, BookmarkMediaType>();
  if (mediaTypeIds.length === 0) return byId;

  const rows = await db
    .select({
      id: mediaTypes.id,
      name: mediaTypes.name,
      slug: mediaTypes.slug,
      icon: mediaTypes.icon,
      parentId: mediaTypes.parentId,
    })
    .from(mediaTypes)
    .where(inArray(mediaTypes.id, mediaTypeIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
      icon: row.icon ?? null,
      parentId: row.parentId,
    });
  }
  return byId;
}

/** Load YouTube channels for a set of channel ids in a single query, keyed by channel id. */
async function channelsById(channelIds: string[]): Promise<Map<string, BookmarkYouTubeChannel>> {
  const byId = new Map<string, BookmarkYouTubeChannel>();
  if (channelIds.length === 0) return byId;

  const rows = await db
    .select({
      id: youtubeChannels.id,
      name: youtubeChannels.name,
      slug: youtubeChannels.slug,
      imageCreatedAt: youtubeChannelImages.createdAt,
    })
    .from(youtubeChannels)
    .leftJoin(youtubeChannelImages, eq(youtubeChannelImages.youtubeChannelId, youtubeChannels.id))
    .where(inArray(youtubeChannels.id, channelIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
      imageUrl: row.imageCreatedAt
        ? `/api/youtube-channels/${row.id}/image?v=${new Date(row.imageCreatedAt).getTime()}`
        : null,
    });
  }
  return byId;
}

/** Load newsletters for a set of newsletter ids in a single query, keyed by newsletter id. */
async function newslettersById(newsletterIds: string[]): Promise<Map<string, BookmarkNewsletter>> {
  const byId = new Map<string, BookmarkNewsletter>();
  if (newsletterIds.length === 0) return byId;

  const rows = await db
    .select({
      id: newsletters.id,
      name: newsletters.name,
      slug: newsletters.slug,
    })
    .from(newsletters)
    .where(inArray(newsletters.id, newsletterIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
    });
  }
  return byId;
}

/** Load import events for a set of import ids, keyed by import id. */
async function importsById(importIds: string[]): Promise<Map<string, BookmarkImport>> {
  const byId = new Map<string, BookmarkImport>();
  if (importIds.length === 0) return byId;

  const rows = await db
    .select({
      id: imports.id,
      title: imports.title,
      createdAt: imports.createdAt,
    })
    .from(imports)
    .where(inArray(imports.id, importIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    });
  }
  return byId;
}

/** Load tags for a set of bookmark ids in a single query, grouped by bookmark id. */
async function tagsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkTag[]>> {
  const grouped = new Map<string, BookmarkTag[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTags.bookmarkId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      parentId: tags.parentId,
    })
    .from(bookmarkTags)
    .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
    .where(inArray(bookmarkTags.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
      parentId: row.parentId,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load number custom-property values for a set of bookmarks, grouped by bookmark id. */
async function numberValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkNumberValue[]>> {
  const grouped = new Map<string, BookmarkNumberValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkNumberValues.bookmarkId,
      propertyId: bookmarkNumberValues.propertyId,
      value: bookmarkNumberValues.value,
    })
    .from(bookmarkNumberValues)
    .where(inArray(bookmarkNumberValues.bookmarkId, bookmarkIds));

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

/** Load boolean custom-property values for a set of bookmarks, grouped by bookmark id. */
async function booleanValuesByBookmarkId(
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
async function dateTimeValuesByBookmarkId(
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

/** Load image/file custom-property values for a set of bookmarks, grouped by bookmark id. */
async function fileValuesByBookmarkId(
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

/** Load attached images for a set of bookmarks in a single query, keyed by bookmark id. */
async function imagesByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkImage>> {
  const byId = new Map<string, BookmarkImage>();
  if (bookmarkIds.length === 0) return byId;

  const rows = await db
    .select()
    .from(bookmarkImages)
    .where(inArray(bookmarkImages.bookmarkId, bookmarkIds));

  for (const row of rows) {
    byId.set(row.bookmarkId, bookmarkImageFromRow(row));
  }
  return byId;
}

/**
 * Load typed relationships for a set of bookmark ids, handling both sides of each edge. Returns a
 * map of bookmarkId → its {@link BookmarkRelationship}s, with the other bookmark's role derived from
 * the edge direction: for a directional type, A is the parent and B the child; symmetric types are
 * `related`. Each row is joined to its relationship type for the name + `directional` flag.
 */
async function relationshipsByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkRelationship[]>> {
  const grouped = new Map<string, BookmarkRelationship[]>();
  if (bookmarkIds.length === 0) return grouped;

  const idSet = new Set(bookmarkIds);

  const rels = await db
    .select({
      bookmarkAId: bookmarkRelationships.bookmarkAId,
      bookmarkBId: bookmarkRelationships.bookmarkBId,
      relationshipTypeId: bookmarkRelationships.relationshipTypeId,
      label: bookmarkRelationships.label,
      typeName: relationshipTypes.name,
      directional: relationshipTypes.directional,
    })
    .from(bookmarkRelationships)
    .innerJoin(
      relationshipTypes,
      eq(bookmarkRelationships.relationshipTypeId, relationshipTypes.id),
    )
    .where(
      or(
        inArray(bookmarkRelationships.bookmarkAId, bookmarkIds),
        inArray(bookmarkRelationships.bookmarkBId, bookmarkIds),
      ),
    );

  if (rels.length === 0) return grouped;

  // Collect all "other" bookmark ids we need to fetch (may include ids outside our batch).
  const otherIds = new Set<string>();
  for (const rel of rels) {
    if (idSet.has(rel.bookmarkAId)) otherIds.add(rel.bookmarkBId);
    if (idSet.has(rel.bookmarkBId)) otherIds.add(rel.bookmarkAId);
  }

  const otherRows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(inArray(bookmarks.id, [...otherIds]));

  const otherById = new Map(otherRows.map(row => [row.id, row]));

  for (const rel of rels) {
    const addTo = (ownId: string, otherId: string, ownIsParent: boolean) => {
      if (!idSet.has(ownId)) return;
      const other = otherById.get(otherId);
      if (!other) return;
      const role: RelationshipRole = !rel.directional
        ? "related"
        : ownIsParent
          ? "child" // the OTHER bookmark is the child
          : "parent";
      const list = grouped.get(ownId) ?? [];
      list.push({
        bookmark: {
          id: other.id,
          url: other.url,
          title: other.title,
        },
        relationshipTypeId: rel.relationshipTypeId,
        relationshipTypeName: rel.typeName,
        directional: rel.directional,
        role,
        label: rel.label,
      });
      grouped.set(ownId, list);
    };
    // A is the parent/source, B is the child/target (for directional types).
    addTo(rel.bookmarkAId, rel.bookmarkBId, true);
    addTo(rel.bookmarkBId, rel.bookmarkAId, false);
  }

  return grouped;
}

/** Hydrate all custom-property relations for a set of bookmark rows in batched queries. */
async function extrasByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkExtras>> {
  const [tagsMap, numberMap, booleanMap, dateTimeMap, fileMap, imageMap, relationshipsMap] = await Promise.all([
    tagsByBookmarkId(bookmarkIds),
    numberValuesByBookmarkId(bookmarkIds),
    booleanValuesByBookmarkId(bookmarkIds),
    dateTimeValuesByBookmarkId(bookmarkIds),
    fileValuesByBookmarkId(bookmarkIds),
    imagesByBookmarkId(bookmarkIds),
    relationshipsByBookmarkId(bookmarkIds),
  ]);
  const grouped = new Map<string, BookmarkExtras>();
  for (const id of bookmarkIds) {
    grouped.set(id, {
      website: null,
      mediaType: null,
      youtubeChannel: null,
      newsletter: null,
      import: null,
      tags: tagsMap.get(id) ?? [],
      numberValues: numberMap.get(id) ?? [],
      booleanValues: booleanMap.get(id) ?? [],
      dateTimeValues: dateTimeMap.get(id) ?? [],
      fileValues: fileMap.get(id) ?? [],
      image: imageMap.get(id) ?? null,
      relationships: relationshipsMap.get(id) ?? [],
    });
  }
  return grouped;
}

/** Hydrate a list of bookmark rows into wire types (shared by list/get/homepage/sections). */
export async function hydrateBookmarkRows(rows: BookmarkRow[]): Promise<Bookmark[]> {
  if (rows.length === 0) return [];
  const defaultCategoryId = await ensureDefaultCategory();
  const websiteIds = [...new Set(rows.map(row => row.websiteId).filter((id): id is string => id !== null))];
  const mediaTypeIds = [...new Set(rows.map(row => row.mediaTypeId).filter((id): id is string => id !== null))];
  const channelIds = [...new Set(rows.map(row => row.youtubeChannelId).filter((id): id is string => id !== null))];
  const newsletterIds = [...new Set(rows.map(row => row.newsletterId).filter((id): id is string => id !== null))];
  const issueIds = [...new Set(rows.map(row => row.importId).filter((id): id is string => id !== null))];
  const [grouped, websiteMap, mediaTypeMap, channelMap, newsletterMap, importMap] = await Promise.all([
    extrasByBookmarkId(rows.map(row => row.id)),
    websitesById(websiteIds),
    mediaTypesById(mediaTypeIds),
    channelsById(channelIds),
    newslettersById(newsletterIds),
    importsById(issueIds),
  ]);
  return rows.map((row) => {
    const extras = grouped.get(row.id) ?? EMPTY_EXTRAS;
    return toBookmark(row, {
      ...extras,
      website: row.websiteId ? websiteMap.get(row.websiteId) ?? null : null,
      mediaType: row.mediaTypeId ? mediaTypeMap.get(row.mediaTypeId) ?? null : null,
      youtubeChannel: row.youtubeChannelId ? channelMap.get(row.youtubeChannelId) ?? null : null,
      newsletter: row.newsletterId ? newsletterMap.get(row.newsletterId) ?? null : null,
      import: row.importId ? importMap.get(row.importId) ?? null : null,
    }, defaultCategoryId);
  });
}
