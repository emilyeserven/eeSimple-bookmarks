import { eq, inArray } from "drizzle-orm";
import type {
  BookmarkImport,
  BookmarkMediaType,
  BookmarkNewsletter,
  BookmarkWebsite,
  BookmarkYouTubeChannel,
} from "@eesimple/types";
import { db } from "@/db";
import {
  imports,
  mediaTypes,
  newsletters,
  websiteFavicons,
  websites,
  youtubeChannelImages,
  youtubeChannels,
} from "@/db/schema";

/** Load websites for a set of website ids in a single query, keyed by website id. */
export async function websitesById(websiteIds: string[]): Promise<Map<string, BookmarkWebsite>> {
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
export async function mediaTypesById(mediaTypeIds: string[]): Promise<Map<string, BookmarkMediaType>> {
  const byId = new Map<string, BookmarkMediaType>();
  if (mediaTypeIds.length === 0) return byId;

  const rows = await db
    .select({
      id: mediaTypes.id,
      name: mediaTypes.name,
      slug: mediaTypes.slug,
      icon: mediaTypes.icon,
      parentId: mediaTypes.parentId,
      builtIn: mediaTypes.builtIn,
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
      builtIn: row.builtIn,
    });
  }
  return byId;
}

/** Load YouTube channels for a set of channel ids in a single query, keyed by channel id. */
export async function channelsById(channelIds: string[]): Promise<Map<string, BookmarkYouTubeChannel>> {
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
export async function newslettersById(newsletterIds: string[]): Promise<Map<string, BookmarkNewsletter>> {
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
export async function importsById(importIds: string[]): Promise<Map<string, BookmarkImport>> {
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
