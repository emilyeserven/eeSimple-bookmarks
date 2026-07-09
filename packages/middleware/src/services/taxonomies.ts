import { asc, eq, sql } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateTaxonomyInput,
  Taxonomy,
  UpdateTaxonomyInput,
} from "@eesimple/types";
import { GENRES_MOODS_TAXONOMY_SLUG } from "@eesimple/types";
import { db } from "@/db";
import { taxonomies, taxonomyAssignments, taxonomyTerms, type TaxonomyRow } from "@/db/schema";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { AppError } from "@/utils/errors";
import { uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when an update or delete targets a built-in taxonomy in a disallowed way. */
export class BuiltInTaxonomyError extends AppError {
  constructor(message: string) {
    super(message, "builtInImmutable", 403);
  }
}

/** Thrown when a create/rename collides with an existing taxonomy slug/name. */
export class DuplicateTaxonomyError extends AppError {
  constructor(name: string) {
    super(`A taxonomy named "${name}" already exists`, "duplicateName", 409, {
      entity: "taxonomy",
      name,
    });
  }
}

/** Map a DB row (plus optional counts) to the shared `Taxonomy` wire type. */
function toTaxonomy(
  row: TaxonomyRow,
  counts?: { termCount: number;
    bookmarkCount: number; },
): Taxonomy {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    hierarchical: row.hierarchical,
    singleValue: row.singleValue,
    builtIn: row.builtIn,
    hidden: row.hidden ?? false,
    icon: row.icon,
    showInSidebar: row.showInSidebar,
    customLayout: row.customLayout ?? false,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    termCount: counts?.termCount,
    bookmarkCount: counts?.bookmarkCount,
  };
}

const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(taxonomies, taxonomies.slug, taxonomies.id, excludeId);

/** List every taxonomy, ordered by `sortOrder` then name, with term + distinct-bookmark counts. */
export async function listTaxonomies(): Promise<Taxonomy[]> {
  const rows = await db
    .select()
    .from(taxonomies)
    .orderBy(asc(taxonomies.sortOrder), asc(taxonomies.name));

  const termCounts = await db
    .select({
      taxonomyId: taxonomyTerms.taxonomyId,
      count: sql<number>`count(*)::int`,
    })
    .from(taxonomyTerms)
    .groupBy(taxonomyTerms.taxonomyId);
  const termCountByTaxonomy = new Map(termCounts.map(r => [r.taxonomyId, r.count]));

  const bookmarkCounts = await db
    .select({
      taxonomyId: taxonomyAssignments.taxonomyId,
      count: sql<number>`count(distinct ${taxonomyAssignments.ownerId})::int`,
    })
    .from(taxonomyAssignments)
    .where(eq(taxonomyAssignments.ownerType, "bookmark"))
    .groupBy(taxonomyAssignments.taxonomyId);
  const bookmarkCountByTaxonomy = new Map(bookmarkCounts.map(r => [r.taxonomyId, r.count]));

  return rows.map(row => toTaxonomy(row, {
    termCount: termCountByTaxonomy.get(row.id) ?? 0,
    bookmarkCount: bookmarkCountByTaxonomy.get(row.id) ?? 0,
  }));
}

/** Resolve a single taxonomy by id. */
export async function getTaxonomy(id: string): Promise<Taxonomy | null> {
  const [row] = await db.select().from(taxonomies).where(eq(taxonomies.id, id));
  return row ? toTaxonomy(row) : null;
}

/** Resolve a single taxonomy by slug. */
export async function getTaxonomyBySlug(slug: string): Promise<Taxonomy | null> {
  const [row] = await db.select().from(taxonomies).where(eq(taxonomies.slug, slug));
  return row ? toTaxonomy(row) : null;
}

/** Create a taxonomy. Slug is minted unique from the name (or a provided slug base). */
export async function createTaxonomy(input: CreateTaxonomyInput): Promise<Taxonomy> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateTaxonomyError(input.name);

  const slug = uniqueSlug(input.slug ?? name, await takenSlugs(), "taxonomy");
  const [row] = await db
    .insert(taxonomies)
    .values({
      name,
      slug,
      description: input.description ?? null,
      hierarchical: input.hierarchical ?? true,
      singleValue: input.singleValue ?? false,
      icon: input.icon ?? null,
      showInSidebar: input.showInSidebar ?? true,
      customLayout: input.customLayout ?? false,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return toTaxonomy(row);
}

/**
 * Update a taxonomy's config. Built-ins may be hidden and reconfigured (icon, layout, sidebar,
 * sort, single/multi, hierarchical) but never renamed or re-slugged — the `hidden` toggle and the
 * other knobs sit outside the rename guard so a built-in stays adjustable.
 */
export async function updateTaxonomy(
  id: string,
  input: UpdateTaxonomyInput,
): Promise<Taxonomy | null> {
  const [current] = await db.select().from(taxonomies).where(eq(taxonomies.id, id));
  if (!current) return null;

  const renaming = (input.name !== undefined && input.name.trim() !== current.name)
    || (input.slug !== undefined && input.slug !== current.slug);
  if (current.builtIn && renaming) {
    throw new BuiltInTaxonomyError("Built-in taxonomies can't be renamed");
  }

  const patch: Partial<TaxonomyRow> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.slug !== undefined) patch.slug = uniqueSlug(input.slug, await takenSlugs(id), "taxonomy");
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.hierarchical !== undefined) patch.hierarchical = input.hierarchical;
  if (input.singleValue !== undefined) patch.singleValue = input.singleValue;
  if (input.icon !== undefined) patch.icon = input.icon ?? null;
  if (input.showInSidebar !== undefined) patch.showInSidebar = input.showInSidebar;
  if (input.hidden !== undefined) patch.hidden = input.hidden ?? false;
  if (input.customLayout !== undefined) patch.customLayout = input.customLayout ?? false;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toTaxonomy(current);

  const [row] = await db.update(taxonomies).set(patch).where(eq(taxonomies.id, id)).returning();
  return row ? toTaxonomy(row) : null;
}

/** Delete a taxonomy (cascade removes its terms + value-side assignment rows). Blocks built-ins. */
export async function deleteTaxonomy(id: string): Promise<boolean> {
  const [current] = await db.select().from(taxonomies).where(eq(taxonomies.id, id));
  if (!current) return false;
  if (current.builtIn) {
    throw new BuiltInTaxonomyError("Built-in taxonomies can't be deleted (hide or demote instead)");
  }
  const rows = await db.delete(taxonomies).where(eq(taxonomies.id, id)).returning({
    id: taxonomies.id,
  });
  return rows.length > 0;
}

/** Delete many taxonomies, skipping built-ins (reported as not-deletable). */
export function bulkDeleteTaxonomies(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteTaxonomy, err => err instanceof BuiltInTaxonomyError);
}

/**
 * Seed the built-in "Genres & Moods" taxonomy row (idempotent, insert-by-slug). Terms come from the
 * migrate.ts copy on existing installs, or start empty on a fresh install — matching today's
 * empty-on-fresh G&M. Slotted into the `ensure*` boot block in `src/index.ts`.
 */
export async function ensureBuiltInTaxonomies(): Promise<void> {
  await db
    .insert(taxonomies)
    .values({
      name: "Genres & Moods",
      slug: GENRES_MOODS_TAXONOMY_SLUG,
      description: null,
      hierarchical: true,
      singleValue: false,
      builtIn: true,
      icon: "Drama",
      showInSidebar: true,
      sortOrder: 0,
    })
    .onConflictDoNothing({
      target: taxonomies.slug,
    });
}
