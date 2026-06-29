import { asc, count, eq, inArray, isNull } from "drizzle-orm";
import type { Author, CreateAuthorInput, SocialLink, UpdateAuthorInput } from "@eesimple/types";
import { db } from "@/db";
import {
  authorImages,
  authorPublishers,
  authors,
  authorWebsites,
  authorYoutubeChannels,
  bookmarkAuthors,
  type AuthorRow,
} from "@/db/schema";
import { getAuthorImageRow } from "@/services/authorImages";
import { extractSocialProfileLinks, fetchBodyHtmlResult } from "@/services/metadata";
import { buildStringMap } from "@/utils/mapUtils";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing author name. */
export class DuplicateAuthorError extends Error {
  constructor(name: string) {
    super(`An author named "${name}" already exists`);
    this.name = "DuplicateAuthorError";
  }
}

function avatarUrlFrom(authorId: string, createdAt: Date | string | null): string | null {
  if (!createdAt) return null;
  const time = (createdAt instanceof Date ? createdAt : new Date(createdAt)).getTime();
  return `/api/authors/${authorId}/image?v=${time}`;
}

/** Load YouTube channel IDs for a set of author IDs as a map of authorId → channelId[]. */
async function loadAuthorYoutubeChannelMap(authorIds: string[]): Promise<Map<string, string[]>> {
  if (authorIds.length === 0) return new Map();
  const rows = await db
    .select({
      authorId: authorYoutubeChannels.authorId,
      channelId: authorYoutubeChannels.channelId,
    })
    .from(authorYoutubeChannels)
    .where(inArray(authorYoutubeChannels.authorId, authorIds));
  return buildStringMap(rows, r => r.authorId, r => r.channelId);
}

/** Load website IDs for a set of author IDs as a map of authorId → websiteId[]. */
async function loadAuthorWebsiteMap(authorIds: string[]): Promise<Map<string, string[]>> {
  if (authorIds.length === 0) return new Map();
  const rows = await db
    .select({
      authorId: authorWebsites.authorId,
      websiteId: authorWebsites.websiteId,
    })
    .from(authorWebsites)
    .where(inArray(authorWebsites.authorId, authorIds));
  return buildStringMap(rows, r => r.authorId, r => r.websiteId);
}

/** Load publisher IDs for a set of author IDs as a map of authorId → publisherId[]. */
async function loadAuthorPublisherMap(authorIds: string[]): Promise<Map<string, string[]>> {
  if (authorIds.length === 0) return new Map();
  const rows = await db
    .select({
      authorId: authorPublishers.authorId,
      publisherId: authorPublishers.publisherId,
    })
    .from(authorPublishers)
    .where(inArray(authorPublishers.authorId, authorIds));
  return buildStringMap(rows, r => r.authorId, r => r.publisherId);
}

/** Replace the full set of YouTube channels for an author (delete-then-insert). */
async function setAuthorYoutubeChannels(
  txOrDb: Tx | typeof db,
  authorId: string,
  channelIds: string[],
): Promise<void> {
  await txOrDb.delete(authorYoutubeChannels).where(eq(authorYoutubeChannels.authorId, authorId));
  if (channelIds.length > 0) {
    await txOrDb.insert(authorYoutubeChannels).values(channelIds.map(channelId => ({
      authorId,
      channelId,
    })));
  }
}

/** Replace the full set of websites for an author (delete-then-insert). */
async function setAuthorWebsites(
  txOrDb: Tx | typeof db,
  authorId: string,
  websiteIds: string[],
): Promise<void> {
  await txOrDb.delete(authorWebsites).where(eq(authorWebsites.authorId, authorId));
  if (websiteIds.length > 0) {
    await txOrDb.insert(authorWebsites).values(websiteIds.map(websiteId => ({
      authorId,
      websiteId,
    })));
  }
}

/** Replace the full set of publishers for an author (delete-then-insert). */
async function setAuthorPublishers(
  txOrDb: Tx | typeof db,
  authorId: string,
  publisherIds: string[],
): Promise<void> {
  await txOrDb.delete(authorPublishers).where(eq(authorPublishers.authorId, authorId));
  if (publisherIds.length > 0) {
    await txOrDb.insert(authorPublishers).values(publisherIds.map(publisherId => ({
      authorId,
      publisherId,
    })));
  }
}

/** Map a DB row to the shared `Author` wire type. */
function toAuthor(
  row: AuthorRow & { avatarCreatedAt?: Date | string | null },
  bookmarkCount?: number,
  youtubeChannelIds: string[] = [],
  websiteIds: string[] = [],
  publisherIds: string[] = [],
): Author {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
    slug: row.slug ?? slugify(row.name),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount,
    authorWebsiteUrl: row.authorWebsiteUrl ?? null,
    biographyUrl: row.biographyUrl ?? null,
    imageUrl: avatarUrlFrom(row.id, row.avatarCreatedAt ?? null),
    socialLinks: (row.socialLinks as SocialLink[] | null) ?? [],
    youtubeChannelIds,
    websiteIds,
    publisherIds,
  };
}

/** Existing author slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(authors, authors.slug, authors.id, excludeId);

/** List all authors, ordered by name, with bookmark counts and association IDs. */
export async function listAuthors(): Promise<Author[]> {
  const rows = await db
    .select({
      id: authors.id,
      name: authors.name,
      romanizedName: authors.romanizedName,
      slug: authors.slug,
      authorWebsiteUrl: authors.authorWebsiteUrl,
      biographyUrl: authors.biographyUrl,
      socialLinks: authors.socialLinks,
      createdAt: authors.createdAt,
      avatarCreatedAt: authorImages.createdAt,
    })
    .from(authors)
    .leftJoin(authorImages, eq(authorImages.authorId, authors.id))
    .orderBy(asc(authors.name));

  const ids = rows.map(r => r.id);

  const [counts, channelMap, websiteMap, publisherMap] = await Promise.all([
    db
      .select({
        authorId: bookmarkAuthors.authorId,
        count: count(),
      })
      .from(bookmarkAuthors)
      .groupBy(bookmarkAuthors.authorId),
    loadAuthorYoutubeChannelMap(ids),
    loadAuthorWebsiteMap(ids),
    loadAuthorPublisherMap(ids),
  ]);

  const countMap = new Map(counts.map(c => [c.authorId, Number(c.count)]));
  return rows.map(row =>
    toAuthor(
      row,
      countMap.get(row.id) ?? 0,
      channelMap.get(row.id) ?? [],
      websiteMap.get(row.id) ?? [],
      publisherMap.get(row.id) ?? [],
    ));
}

/** Add a new author. Throws `DuplicateAuthorError` on a name clash. */
export async function createAuthor(input: CreateAuthorInput): Promise<Author> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateAuthorError(input.name);

  const [clash] = await db.select({
    id: authors.id,
  }).from(authors).where(eq(authors.name, name));
  if (clash) throw new DuplicateAuthorError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(authors).values({
    name,
    romanizedName: input.romanizedName ?? null,
    slug,
  }).returning();
  return toAuthor(row);
}

/** Update an author's fields and/or association sets. Throws `DuplicateAuthorError` on a name clash. */
export async function updateAuthor(id: string, input: UpdateAuthorInput): Promise<Author | null> {
  const [existing] = await db.select().from(authors).where(eq(authors.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<AuthorRow, "name" | "romanizedName" | "slug" | "authorWebsiteUrl" | "biographyUrl" | "socialLinks">> = {};
  if ("romanizedName" in input) patch.romanizedName = input.romanizedName ?? null;
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: authors.id,
    }).from(authors).where(eq(authors.name, name));
    if (clash && clash.id !== id) throw new DuplicateAuthorError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if ("authorWebsiteUrl" in input) patch.authorWebsiteUrl = input.authorWebsiteUrl ?? null;
  if ("biographyUrl" in input) patch.biographyUrl = input.biographyUrl ?? null;
  if ("socialLinks" in input) patch.socialLinks = input.socialLinks ?? [];

  const hasAssociationChanges
    = input.youtubeChannelIds !== undefined
      || input.websiteIds !== undefined
      || input.publisherIds !== undefined;

  if (Object.keys(patch).length === 0 && !hasAssociationChanges) {
    const [imageRow, channelMap, websiteMap, publisherMap] = await Promise.all([
      getAuthorImageRow(id),
      loadAuthorYoutubeChannelMap([id]),
      loadAuthorWebsiteMap([id]),
      loadAuthorPublisherMap([id]),
    ]);
    return toAuthor(
      {
        ...existing,
        avatarCreatedAt: imageRow?.createdAt ?? null,
      },
      undefined,
      channelMap.get(id) ?? [],
      websiteMap.get(id) ?? [],
      publisherMap.get(id) ?? [],
    );
  }

  return db.transaction(async (tx) => {
    let row = existing;
    if (Object.keys(patch).length > 0) {
      const [updated] = await tx.update(authors).set(patch).where(eq(authors.id, id)).returning();
      if (!updated) return null;
      row = updated;
    }
    if (input.youtubeChannelIds !== undefined) {
      await setAuthorYoutubeChannels(tx, id, input.youtubeChannelIds);
    }
    if (input.websiteIds !== undefined) {
      await setAuthorWebsites(tx, id, input.websiteIds);
    }
    if (input.publisherIds !== undefined) {
      await setAuthorPublishers(tx, id, input.publisherIds);
    }
    const [imageRow, channelMap, websiteMap, publisherMap] = await Promise.all([
      getAuthorImageRow(id),
      loadAuthorYoutubeChannelMap([id]),
      loadAuthorWebsiteMap([id]),
      loadAuthorPublisherMap([id]),
    ]);
    return toAuthor(
      {
        ...row,
        avatarCreatedAt: imageRow?.createdAt ?? null,
      },
      undefined,
      channelMap.get(id) ?? [],
      websiteMap.get(id) ?? [],
      publisherMap.get(id) ?? [],
    );
  });
}

/**
 * Fetch the author's website and scan it for GitHub, Goodreads, and Bluesky profile links. Returns
 * the detected links, or a typed reason detection couldn't proceed.
 */
export async function detectAuthorSocialLinksFromWebsite(
  id: string,
): Promise<SocialLink[] | "not_found" | "no_url" | "fetch_error"> {
  const [row] = await db
    .select({
      authorWebsiteUrl: authors.authorWebsiteUrl,
    })
    .from(authors)
    .where(eq(authors.id, id));

  if (!row) return "not_found";
  if (!row.authorWebsiteUrl) return "no_url";

  const result = await fetchBodyHtmlResult(row.authorWebsiteUrl, /<\/body>/i);
  if (result.kind !== "ok") return "fetch_error";

  return extractSocialProfileLinks(result.html, row.authorWebsiteUrl);
}

/** Delete an author. Bookmark join rows are removed via cascade. Returns false when not found. */
export async function deleteAuthor(id: string): Promise<boolean> {
  const rows = await db.delete(authors).where(eq(authors.id, id)).returning({
    id: authors.id,
  });
  return rows.length > 0;
}

/** Fill in slugs for any authors missing one (e.g. rows that predate the `slug` column). */
export async function backfillAuthorSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: authors.id,
      name: authors.name,
    })
    .from(authors)
    .where(isNull(authors.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const author of missing) {
    const slug = uniqueSlug(author.name, taken);
    taken.push(slug);
    await db.update(authors).set({
      slug,
    }).where(eq(authors.id, author.id));
  }
}
