import { count, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreatePublisherInput,
  Publisher,
  UpdatePublisherInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { bookmarks, publishers, type PublisherRow, websites } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing publisher name. */
export class DuplicatePublisherError extends Error {
  constructor(name: string) {
    super(`A publisher named "${name}" already exists`);
    this.name = "DuplicatePublisherError";
  }
}

function toPublisher(
  row: PublisherRow,
  website: { id: string;
    domain: string;
    siteName: string; } | null,
  bookmarkCount?: number,
): Publisher {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    websiteId: row.websiteId,
    website: website ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount,
  };
}

export async function listPublishers(): Promise<Publisher[]> {
  const rows = await db
    .select({
      publisher: publishers,
      website: {
        id: websites.id,
        domain: websites.domain,
        siteName: websites.siteName,
      },
      bookmarkCount: count(bookmarks.id),
    })
    .from(publishers)
    .leftJoin(websites, eq(publishers.websiteId, websites.id))
    .leftJoin(bookmarks, eq(bookmarks.publisherId, publishers.id))
    .groupBy(publishers.id, websites.id, websites.domain, websites.siteName)
    .orderBy(publishers.name);

  return rows.map(r =>
    toPublisher(
      r.publisher,
      r.website ?? null,
      r.bookmarkCount,
    ));
}

export async function getPublisherBySlug(slug: string): Promise<Publisher | null> {
  const rows = await db
    .select({
      publisher: publishers,
      website: {
        id: websites.id,
        domain: websites.domain,
        siteName: websites.siteName,
      },
    })
    .from(publishers)
    .leftJoin(websites, eq(publishers.websiteId, websites.id))
    .where(eq(publishers.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return toPublisher(r.publisher, r.website ?? null);
}

export async function getPublisherById(id: string): Promise<Publisher | null> {
  const rows = await db
    .select({
      publisher: publishers,
      website: {
        id: websites.id,
        domain: websites.domain,
        siteName: websites.siteName,
      },
    })
    .from(publishers)
    .leftJoin(websites, eq(publishers.websiteId, websites.id))
    .where(eq(publishers.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return toPublisher(r.publisher, r.website ?? null);
}

export async function createPublisher(input: CreatePublisherInput): Promise<Publisher> {
  const existing = await db
    .select({
      id: publishers.id,
    })
    .from(publishers)
    .where(eq(publishers.name, input.name));
  if (existing.length > 0) throw new DuplicatePublisherError(input.name);

  const takenSlugs = await takenSlugsOf(publishers, publishers.slug, publishers.id);
  const slug = uniqueSlug(slugify(input.name), takenSlugs);

  const [row] = await db
    .insert(publishers)
    .values({
      name: input.name,
      slug,
      websiteId: input.websiteId ?? null,
    })
    .returning();
  return getPublisherById(row.id) as Promise<Publisher>;
}

export async function updatePublisher(id: string, input: UpdatePublisherInput): Promise<Publisher> {
  const existing = await db
    .select({
      id: publishers.id,
      name: publishers.name,
      slug: publishers.slug,
    })
    .from(publishers)
    .where(eq(publishers.id, id))
    .limit(1);
  if (existing.length === 0) throw new Error(`Publisher ${id} not found`);
  const current = existing[0];

  if (input.name !== undefined && input.name !== current.name) {
    const collision = await db
      .select({
        id: publishers.id,
      })
      .from(publishers)
      .where(eq(publishers.name, input.name));
    if (collision.length > 0) throw new DuplicatePublisherError(input.name);
  }

  const updates: Partial<typeof publishers.$inferInsert> = {};
  if (input.name !== undefined) {
    updates.name = input.name;
    const takenSlugs = await takenSlugsOf(publishers, publishers.slug, publishers.id, id);
    updates.slug = uniqueSlug(slugify(input.name), takenSlugs);
  }
  if ("websiteId" in input) {
    updates.websiteId = input.websiteId ?? null;
  }

  await db.update(publishers).set(updates).where(eq(publishers.id, id));
  return getPublisherById(id) as Promise<Publisher>;
}

export async function deletePublisher(id: string): Promise<boolean> {
  const result = await db.delete(publishers).where(eq(publishers.id, id)).returning({
    id: publishers.id,
  });
  return result.length > 0;
}

export async function bulkDeletePublishers(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deletePublisher);
}

export async function backfillPublisherSlugs(): Promise<void> {
  const rows = await db
    .select({
      id: publishers.id,
      name: publishers.name,
    })
    .from(publishers)
    .where(isNull(publishers.slug));
  if (rows.length === 0) return;
  const takenSlugs = await takenSlugsOf(publishers, publishers.slug, publishers.id);
  for (const row of rows) {
    const slug = uniqueSlug(slugify(row.name), takenSlugs);
    takenSlugs.push(slug);
    await db.update(publishers).set({
      slug,
    }).where(eq(publishers.id, row.id));
  }
}
