import { count, eq, inArray, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  Group,
  CreateGroupInput,
  EntityName,
  SocialLink,
  UpdateGroupInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  albumGroups,
  bookmarks,
  groupImages,
  groups,
  groupTypes,
  groupWebsites,
  groupYoutubeChannels,
  type GroupRow,
  websites,
} from "@/db/schema";
import { deleteGenreMoodAssignmentsForOwner } from "@/services/genreMoodAssignments";
import { deleteEntityNamesForOwner, loadEntityNames } from "@/services/entityNames";
import { getGroupImageRow } from "@/services/groupImages";
import { buildStringMap } from "@/utils/mapUtils";
import { deleteObject } from "@/utils/objectStore";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing group name. */
export class DuplicateGroupError extends Error {
  constructor(name: string) {
    super(`A group named "${name}" already exists`);
    this.name = "DuplicateGroupError";
  }
}

type WebsiteJoin = { id: string;
  domain: string;
  siteName: string; } | null;

type GroupTypeJoin = { id: string;
  name: string;
  slug: string | null; } | null;

const groupTypeSelect = {
  id: groupTypes.id,
  name: groupTypes.name,
  slug: groupTypes.slug,
} as const;

const websiteSelect = {
  id: websites.id,
  domain: websites.domain,
  siteName: websites.siteName,
} as const;

function imageUrlFrom(groupId: string, imageCreatedAt: Date | string | null): string | null {
  if (!imageCreatedAt) return null;
  const time = (imageCreatedAt instanceof Date ? imageCreatedAt : new Date(imageCreatedAt)).getTime();
  return `/api/groups/${groupId}/image?v=${time}`;
}

/** The Plex/creator columns absorbed from the former Artists taxonomy (not the M2M/website sets). */
type GroupDataColumns = Pick<
  GroupRow,
  "plexRatingKey" | "plexItemType" | "plexItemTitle" | "year"
>;

/** Build the settable creator data columns from an update input; missing keys are left untouched. */
function creatorDataFromInput(input: UpdateGroupInput): Partial<GroupDataColumns> {
  const patch: Partial<GroupDataColumns> = {};
  if (input.plexRatingKey !== undefined) patch.plexRatingKey = input.plexRatingKey ?? null;
  if (input.plexItemType !== undefined) patch.plexItemType = input.plexItemType ?? null;
  if (input.plexItemTitle !== undefined) patch.plexItemTitle = input.plexItemTitle ?? null;
  if (input.year !== undefined) patch.year = input.year ?? null;
  return patch;
}

/** Load album ids (credits) for a set of group ids as a map of groupId → albumId[]. */
async function loadGroupAlbumMap(groupIds: string[]): Promise<Map<string, string[]>> {
  if (groupIds.length === 0) return new Map();
  const rows = await db
    .select({
      groupId: albumGroups.groupId,
      albumId: albumGroups.albumId,
    })
    .from(albumGroups)
    .where(inArray(albumGroups.groupId, groupIds));
  return buildStringMap(rows, r => r.groupId, r => r.albumId);
}

/** Replace the full set of album credits for a group (delete-then-insert on the shared join). */
async function setGroupAlbums(
  txOrDb: Tx | typeof db,
  groupId: string,
  albumIds: string[],
): Promise<void> {
  await txOrDb.delete(albumGroups).where(eq(albumGroups.groupId, groupId));
  if (albumIds.length > 0) {
    await txOrDb.insert(albumGroups).values(albumIds.map(albumId => ({
      albumId,
      groupId,
    })));
  }
}

/** Load YouTube channel ids for a set of group ids as a map of groupId → channelId[]. */
async function loadGroupYoutubeChannelMap(groupIds: string[]): Promise<Map<string, string[]>> {
  if (groupIds.length === 0) return new Map();
  const rows = await db
    .select({
      groupId: groupYoutubeChannels.groupId,
      channelId: groupYoutubeChannels.channelId,
    })
    .from(groupYoutubeChannels)
    .where(inArray(groupYoutubeChannels.groupId, groupIds));
  return buildStringMap(rows, r => r.groupId, r => r.channelId);
}

/** Load website ids for a set of group ids as a map of groupId → websiteId[]. */
async function loadGroupWebsiteMap(groupIds: string[]): Promise<Map<string, string[]>> {
  if (groupIds.length === 0) return new Map();
  const rows = await db
    .select({
      groupId: groupWebsites.groupId,
      websiteId: groupWebsites.websiteId,
    })
    .from(groupWebsites)
    .where(inArray(groupWebsites.groupId, groupIds));
  return buildStringMap(rows, r => r.groupId, r => r.websiteId);
}

/** Replace the full set of associated YouTube channels for a group (delete-then-insert). */
async function setGroupYoutubeChannels(
  txOrDb: Tx | typeof db,
  groupId: string,
  channelIds: string[],
): Promise<void> {
  await txOrDb.delete(groupYoutubeChannels).where(eq(groupYoutubeChannels.groupId, groupId));
  if (channelIds.length > 0) {
    await txOrDb.insert(groupYoutubeChannels).values(channelIds.map(channelId => ({
      groupId,
      channelId,
    })));
  }
}

/** Replace the full set of associated websites for a group (delete-then-insert). */
async function setGroupWebsites(
  txOrDb: Tx | typeof db,
  groupId: string,
  websiteIds: string[],
): Promise<void> {
  await txOrDb.delete(groupWebsites).where(eq(groupWebsites.groupId, groupId));
  if (websiteIds.length > 0) {
    await txOrDb.insert(groupWebsites).values(websiteIds.map(websiteId => ({
      groupId,
      websiteId,
    })));
  }
}

function toGroup(
  row: GroupRow & { imageCreatedAt?: Date | string | null },
  website: WebsiteJoin,
  groupType: GroupTypeJoin,
  bookmarkCount?: number,
  albumIds: string[] = [],
  youtubeChannelIds: string[] = [],
  websiteIds: string[] = [],
  names?: EntityName[],
): Group {
  return {
    id: row.id,
    name: row.name,
    names: names ?? [],
    slug: row.slug ?? slugify(row.name),
    websiteId: row.websiteId,
    website: website ?? null,
    groupTypeId: row.groupTypeId,
    groupType: groupType
      ? {
        id: groupType.id,
        name: groupType.name,
        slug: groupType.slug ?? slugify(groupType.name),
      }
      : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount,
    socialLinks: (row.socialLinks as SocialLink[] | null) ?? [],
    sortOrder: row.sortOrder,
    year: row.year ?? null,
    plexRatingKey: row.plexRatingKey ?? null,
    plexItemType: row.plexItemType ?? null,
    plexItemTitle: row.plexItemTitle ?? null,
    imageUrl: imageUrlFrom(row.id, row.imageCreatedAt ?? null),
    albumIds,
    youtubeChannelIds,
    websiteIds,
  };
}

export async function listGroups(): Promise<Group[]> {
  const rows = await db
    .select({
      group: groups,
      website: websiteSelect,
      groupType: groupTypeSelect,
      imageCreatedAt: groupImages.createdAt,
      bookmarkCount: count(bookmarks.id),
    })
    .from(groups)
    .leftJoin(websites, eq(groups.websiteId, websites.id))
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .leftJoin(groupImages, eq(groupImages.groupId, groups.id))
    .leftJoin(bookmarks, eq(bookmarks.groupId, groups.id))
    .groupBy(
      groups.id,
      websites.id,
      websites.domain,
      websites.siteName,
      groupTypes.id,
      groupTypes.name,
      groupTypes.slug,
      groupImages.createdAt,
    )
    .orderBy(groups.name);

  const ids = rows.map(r => r.group.id);
  const [albumMap, channelMap, websiteMap, namesMap] = await Promise.all([
    loadGroupAlbumMap(ids),
    loadGroupYoutubeChannelMap(ids),
    loadGroupWebsiteMap(ids),
    loadEntityNames("group", ids),
  ]);
  return rows.map(r =>
    toGroup(
      {
        ...r.group,
        imageCreatedAt: r.imageCreatedAt ?? null,
      },
      r.website ?? null,
      r.groupType ?? null,
      r.bookmarkCount,
      albumMap.get(r.group.id) ?? [],
      channelMap.get(r.group.id) ?? [],
      websiteMap.get(r.group.id) ?? [],
      namesMap.get(r.group.id),
    ));
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const rows = await db
    .select({
      group: groups,
      website: websiteSelect,
      groupType: groupTypeSelect,
      imageCreatedAt: groupImages.createdAt,
    })
    .from(groups)
    .leftJoin(websites, eq(groups.websiteId, websites.id))
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .leftJoin(groupImages, eq(groupImages.groupId, groups.id))
    .where(eq(groups.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  const [albumMap, channelMap, websiteMap, namesMap] = await Promise.all([
    loadGroupAlbumMap([r.group.id]),
    loadGroupYoutubeChannelMap([r.group.id]),
    loadGroupWebsiteMap([r.group.id]),
    loadEntityNames("group", [r.group.id]),
  ]);
  return toGroup(
    {
      ...r.group,
      imageCreatedAt: r.imageCreatedAt ?? null,
    },
    r.website ?? null,
    r.groupType ?? null,
    undefined,
    albumMap.get(r.group.id) ?? [],
    channelMap.get(r.group.id) ?? [],
    websiteMap.get(r.group.id) ?? [],
    namesMap.get(r.group.id),
  );
}

export async function getGroupById(id: string): Promise<Group | null> {
  const rows = await db
    .select({
      group: groups,
      website: websiteSelect,
      groupType: groupTypeSelect,
      imageCreatedAt: groupImages.createdAt,
    })
    .from(groups)
    .leftJoin(websites, eq(groups.websiteId, websites.id))
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .leftJoin(groupImages, eq(groupImages.groupId, groups.id))
    .where(eq(groups.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  const [albumMap, channelMap, websiteMap, namesMap] = await Promise.all([
    loadGroupAlbumMap([r.group.id]),
    loadGroupYoutubeChannelMap([r.group.id]),
    loadGroupWebsiteMap([r.group.id]),
    loadEntityNames("group", [r.group.id]),
  ]);
  return toGroup(
    {
      ...r.group,
      imageCreatedAt: r.imageCreatedAt ?? null,
    },
    r.website ?? null,
    r.groupType ?? null,
    undefined,
    albumMap.get(r.group.id) ?? [],
    channelMap.get(r.group.id) ?? [],
    websiteMap.get(r.group.id) ?? [],
    namesMap.get(r.group.id),
  );
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const existing = await db
    .select({
      id: groups.id,
    })
    .from(groups)
    .where(eq(groups.name, input.name));
  if (existing.length > 0) throw new DuplicateGroupError(input.name);

  const takenSlugs = await takenSlugsOf(groups, groups.slug, groups.id);
  const slug = uniqueSlug(slugify(input.name), takenSlugs, "group");

  const [row] = await db
    .insert(groups)
    .values({
      name: input.name,
      slug,
      websiteId: input.websiteId ?? null,
      groupTypeId: input.groupTypeId ?? null,
    })
    .returning();
  return getGroupById(row.id) as Promise<Group>;
}

export async function updateGroup(id: string, input: UpdateGroupInput): Promise<Group> {
  const existing = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
    })
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);
  if (existing.length === 0) throw new Error(`Group ${id} not found`);
  const current = existing[0];

  if (input.name !== undefined && input.name !== current.name) {
    const collision = await db
      .select({
        id: groups.id,
      })
      .from(groups)
      .where(eq(groups.name, input.name));
    if (collision.length > 0) throw new DuplicateGroupError(input.name);
  }

  const updates: Partial<typeof groups.$inferInsert> = {
    ...creatorDataFromInput(input),
  };
  if (input.name !== undefined) {
    updates.name = input.name;
    const takenSlugs = await takenSlugsOf(groups, groups.slug, groups.id, id);
    updates.slug = uniqueSlug(slugify(input.name), takenSlugs, "group");
  }
  if ("websiteId" in input) {
    updates.websiteId = input.websiteId ?? null;
  }
  if ("groupTypeId" in input) {
    updates.groupTypeId = input.groupTypeId ?? null;
  }
  if ("socialLinks" in input) {
    updates.socialLinks = input.socialLinks ?? [];
  }
  if (input.sortOrder !== undefined) {
    updates.sortOrder = input.sortOrder;
  }

  const hasAssociationChanges
    = input.albumIds !== undefined
      || input.youtubeChannelIds !== undefined
      || input.websiteIds !== undefined;

  if (Object.keys(updates).length > 0 || hasAssociationChanges) {
    await db.transaction(async (tx) => {
      if (Object.keys(updates).length > 0) {
        await tx.update(groups).set(updates).where(eq(groups.id, id));
      }
      if (input.albumIds !== undefined) {
        await setGroupAlbums(tx, id, input.albumIds);
      }
      if (input.youtubeChannelIds !== undefined) {
        await setGroupYoutubeChannels(tx, id, input.youtubeChannelIds);
      }
      if (input.websiteIds !== undefined) {
        await setGroupWebsites(tx, id, input.websiteIds);
      }
    });
  }
  return getGroupById(id) as Promise<Group>;
}

export async function deleteGroup(id: string): Promise<boolean> {
  // Look up the image's object key before the delete cascades the image row away.
  const imageRow = await getGroupImageRow(id);
  const result = await db.delete(groups).where(eq(groups.id, id)).returning({
    id: groups.id,
  });
  const deleted = result.length > 0;
  if (deleted) {
    // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
    await deleteGenreMoodAssignmentsForOwner("group", id);
    await deleteEntityNamesForOwner("group", id);
    if (imageRow) await deleteObject(imageRow.objectKey).catch(() => undefined);
  }
  return deleted;
}

export async function bulkDeleteGroups(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteGroup);
}

export async function backfillGroupSlugs(): Promise<void> {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
    })
    .from(groups)
    .where(isNull(groups.slug));
  if (rows.length === 0) return;
  const takenSlugs = await takenSlugsOf(groups, groups.slug, groups.id);
  for (const row of rows) {
    const slug = uniqueSlug(slugify(row.name), takenSlugs, "group");
    takenSlugs.push(slug);
    await db.update(groups).set({
      slug,
    }).where(eq(groups.id, row.id));
  }
}
