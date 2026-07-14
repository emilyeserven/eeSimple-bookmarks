import { count, eq, inArray } from "drizzle-orm";
import type {
  BulkDeleteResult,
  Group,
  CreateGroupInput,
  EntityName,
  LabeledWebsite,
  SocialLink,
  UpdateGroupInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  bookmarkGroups,
  groupImages,
  groups,
  groupTypes,
  groupWebsites,
  groupYoutubeChannels,
  type GroupRow,
} from "@/db/schema";
import { deleteTaxonomyAssignmentsForOwner } from "@/services/taxonomyAssignments";
import { deleteEntityNamesForOwner, loadEntityNames } from "@/services/entityNames";
import { getGroupImageRow } from "@/services/groupImages";
import { AppError } from "@/utils/errors";
import { buildStringMap } from "@/utils/mapUtils";
import { deleteObject } from "@/utils/objectStore";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing group name. */
export class DuplicateGroupError extends AppError {
  constructor(name: string) {
    super(`A group named "${name}" already exists`, "duplicateName", 409, {
      entity: "group",
      name,
    });
  }
}

type GroupTypeJoin = { id: string;
  name: string;
  slug: string | null; } | null;

const groupTypeSelect = {
  id: groupTypes.id,
  name: groupTypes.name,
  slug: groupTypes.slug,
} as const;

function imageUrlFrom(groupId: string, imageCreatedAt: Date | string | null): string | null {
  if (!imageCreatedAt) return null;
  const time = (imageCreatedAt instanceof Date ? imageCreatedAt : new Date(imageCreatedAt)).getTime();
  return `/api/groups/${groupId}/image?v=${time}`;
}

/** The Plex columns absorbed from the former Artists taxonomy (not the M2M/website sets). */
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
  groupType: GroupTypeJoin,
  bookmarkCount?: number,
  youtubeChannelIds: string[] = [],
  websiteIds: string[] = [],
  names?: EntityName[],
): Group {
  return {
    id: row.id,
    name: row.name,
    names: names ?? [],
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    isFavorite: row.isFavorite,
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
    labeledWebsites: (row.labeledWebsites as LabeledWebsite[] | null) ?? [],
    sortOrder: row.sortOrder,
    year: row.year ?? null,
    plexRatingKey: row.plexRatingKey ?? null,
    plexItemType: row.plexItemType ?? null,
    plexItemTitle: row.plexItemTitle ?? null,
    imageUrl: imageUrlFrom(row.id, row.imageCreatedAt ?? null),
    youtubeChannelIds,
    websiteIds,
  };
}

/** Compact `{id, name}` listing of every group, for client-side match-or-create flows. */
export async function listGroupsCompact(): Promise<{ id: string;
  name: string; }[]> {
  return db
    .select({
      id: groups.id,
      name: groups.name,
    })
    .from(groups);
}

export async function listGroups(): Promise<Group[]> {
  const rows = await db
    .select({
      group: groups,
      groupType: groupTypeSelect,
      imageCreatedAt: groupImages.createdAt,
      bookmarkCount: count(bookmarkGroups.bookmarkId),
    })
    .from(groups)
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .leftJoin(groupImages, eq(groupImages.groupId, groups.id))
    .leftJoin(bookmarkGroups, eq(bookmarkGroups.groupId, groups.id))
    .groupBy(
      groups.id,
      groupTypes.id,
      groupTypes.name,
      groupTypes.slug,
      groupImages.createdAt,
    )
    .orderBy(groups.name);

  const ids = rows.map(r => r.group.id);
  const [channelMap, websiteMap, namesMap] = await Promise.all([
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
      r.groupType ?? null,
      r.bookmarkCount,
      channelMap.get(r.group.id) ?? [],
      websiteMap.get(r.group.id) ?? [],
      namesMap.get(r.group.id),
    ));
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const rows = await db
    .select({
      group: groups,
      groupType: groupTypeSelect,
      imageCreatedAt: groupImages.createdAt,
    })
    .from(groups)
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .leftJoin(groupImages, eq(groupImages.groupId, groups.id))
    .where(eq(groups.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  const [channelMap, websiteMap, namesMap] = await Promise.all([
    loadGroupYoutubeChannelMap([r.group.id]),
    loadGroupWebsiteMap([r.group.id]),
    loadEntityNames("group", [r.group.id]),
  ]);
  return toGroup(
    {
      ...r.group,
      imageCreatedAt: r.imageCreatedAt ?? null,
    },
    r.groupType ?? null,
    undefined,
    channelMap.get(r.group.id) ?? [],
    websiteMap.get(r.group.id) ?? [],
    namesMap.get(r.group.id),
  );
}

export async function getGroupById(id: string): Promise<Group | null> {
  const rows = await db
    .select({
      group: groups,
      groupType: groupTypeSelect,
      imageCreatedAt: groupImages.createdAt,
    })
    .from(groups)
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .leftJoin(groupImages, eq(groupImages.groupId, groups.id))
    .where(eq(groups.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  const [channelMap, websiteMap, namesMap] = await Promise.all([
    loadGroupYoutubeChannelMap([r.group.id]),
    loadGroupWebsiteMap([r.group.id]),
    loadEntityNames("group", [r.group.id]),
  ]);
  return toGroup(
    {
      ...r.group,
      imageCreatedAt: r.imageCreatedAt ?? null,
    },
    r.groupType ?? null,
    undefined,
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
      description: input.description ?? null,
      groupTypeId: input.groupTypeId ?? null,
    })
    .returning();

  // Build the response from the inserted row (mirroring createPerson) rather than a `getGroupById`
  // re-read. A brand-new group has no image / YouTube channels / websites / alt-names yet, so the
  // re-read adds only fragility: it joins `group_images` and queries `group_youtube_channels` /
  // `group_websites`, and 500s if any of those relation tables is unavailable in a partially-migrated
  // deploy — which is exactly why extension group-creation failed in prod while people (returned
  // straight from the inserted row) worked.
  const groupType = row.groupTypeId
    ? (await db
      .select(groupTypeSelect)
      .from(groupTypes)
      .where(eq(groupTypes.id, row.groupTypeId))
      .limit(1))[0] ?? null
    : null;
  return toGroup({
    ...row,
    imageCreatedAt: null,
  }, groupType, undefined, [], [], undefined);
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
  if (input.description !== undefined) {
    updates.description = input.description ?? null;
  }
  if ("groupTypeId" in input) {
    updates.groupTypeId = input.groupTypeId ?? null;
  }
  if ("socialLinks" in input) {
    updates.socialLinks = input.socialLinks ?? [];
  }
  if ("labeledWebsites" in input) {
    updates.labeledWebsites = input.labeledWebsites ?? [];
  }
  if (input.sortOrder !== undefined) {
    updates.sortOrder = input.sortOrder;
  }
  if (input.isFavorite !== undefined) {
    updates.isFavorite = input.isFavorite;
  }

  const hasAssociationChanges
    = input.youtubeChannelIds !== undefined
      || input.websiteIds !== undefined;

  if (Object.keys(updates).length > 0 || hasAssociationChanges) {
    await db.transaction(async (tx) => {
      if (Object.keys(updates).length > 0) {
        await tx.update(groups).set(updates).where(eq(groups.id, id));
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
    await deleteTaxonomyAssignmentsForOwner("group", id);
    await deleteEntityNamesForOwner("group", id);
    if (imageRow) await deleteObject(imageRow.objectKey).catch(() => undefined);
  }
  return deleted;
}

export async function bulkDeleteGroups(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteGroup);
}
