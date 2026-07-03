import { count, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  Group,
  CreateGroupInput,
  SocialLink,
  UpdateGroupInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { bookmarks, groups, groupTypes, type GroupRow, websites } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

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

function toGroup(
  row: GroupRow,
  website: WebsiteJoin,
  groupType: GroupTypeJoin,
  bookmarkCount?: number,
): Group {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
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
  };
}

export async function listGroups(): Promise<Group[]> {
  const rows = await db
    .select({
      group: groups,
      website: websiteSelect,
      groupType: groupTypeSelect,
      bookmarkCount: count(bookmarks.id),
    })
    .from(groups)
    .leftJoin(websites, eq(groups.websiteId, websites.id))
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .leftJoin(bookmarks, eq(bookmarks.groupId, groups.id))
    .groupBy(
      groups.id,
      websites.id,
      websites.domain,
      websites.siteName,
      groupTypes.id,
      groupTypes.name,
      groupTypes.slug,
    )
    .orderBy(groups.name);

  return rows.map(r =>
    toGroup(
      r.group,
      r.website ?? null,
      r.groupType ?? null,
      r.bookmarkCount,
    ));
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const rows = await db
    .select({
      group: groups,
      website: websiteSelect,
      groupType: groupTypeSelect,
    })
    .from(groups)
    .leftJoin(websites, eq(groups.websiteId, websites.id))
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .where(eq(groups.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return toGroup(r.group, r.website ?? null, r.groupType ?? null);
}

export async function getGroupById(id: string): Promise<Group | null> {
  const rows = await db
    .select({
      group: groups,
      website: websiteSelect,
      groupType: groupTypeSelect,
    })
    .from(groups)
    .leftJoin(websites, eq(groups.websiteId, websites.id))
    .leftJoin(groupTypes, eq(groups.groupTypeId, groupTypes.id))
    .where(eq(groups.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return toGroup(r.group, r.website ?? null, r.groupType ?? null);
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
  const slug = uniqueSlug(slugify(input.name), takenSlugs);

  const [row] = await db
    .insert(groups)
    .values({
      name: input.name,
      romanizedName: input.romanizedName ?? null,
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

  const updates: Partial<typeof groups.$inferInsert> = {};
  if ("romanizedName" in input) updates.romanizedName = input.romanizedName ?? null;
  if (input.name !== undefined) {
    updates.name = input.name;
    const takenSlugs = await takenSlugsOf(groups, groups.slug, groups.id, id);
    updates.slug = uniqueSlug(slugify(input.name), takenSlugs);
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

  await db.update(groups).set(updates).where(eq(groups.id, id));
  return getGroupById(id) as Promise<Group>;
}

export async function deleteGroup(id: string): Promise<boolean> {
  const result = await db.delete(groups).where(eq(groups.id, id)).returning({
    id: groups.id,
  });
  return result.length > 0;
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
    const slug = uniqueSlug(slugify(row.name), takenSlugs);
    takenSlugs.push(slug);
    await db.update(groups).set({
      slug,
    }).where(eq(groups.id, row.id));
  }
}
