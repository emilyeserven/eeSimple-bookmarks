import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateLanguageUsageLevelInput,
  LanguageUsageKind,
  LanguageUsageLevel,
  UpdateLanguageUsageLevelInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { languageUsageLevels, languageUsages, type LanguageUsageLevelRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing usage-level name in the same kind. */
export class DuplicateLanguageUsageLevelError extends Error {
  constructor(name: string) {
    super(`A usage level named "${name}" already exists`);
    this.name = "DuplicateLanguageUsageLevelError";
  }
}

/** Thrown when editing/deleting a seeded built-in usage level. */
export class BuiltInLanguageUsageLevelError extends Error {
  constructor() {
    super("Built-in usage levels can't be modified or deleted");
    this.name = "BuiltInLanguageUsageLevelError";
  }
}

/** Thrown when a delete's `reassignTo` target is missing or is the level being deleted. */
export class InvalidUsageLevelReassignError extends Error {
  constructor(message = "Invalid reassignment target") {
    super(message);
    this.name = "InvalidUsageLevelReassignError";
  }
}

/** Map a DB row to the shared `LanguageUsageLevel` wire type. */
function toLevel(row: LanguageUsageLevelRow, usageCount = 0): LanguageUsageLevel {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    kind: row.kind as LanguageUsageKind,
    builtIn: row.builtIn,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    usageCount,
  };
}

/** Existing usage-level slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(languageUsageLevels, languageUsageLevels.slug, languageUsageLevels.id, excludeId);

/** Count associations per usage level. Returns a `levelId → count` map. */
async function usageCountsByLevel(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      levelId: languageUsages.usageLevelId,
      count: sql<number>`count(*)::int`,
    })
    .from(languageUsages)
    .groupBy(languageUsages.usageLevelId);
  return new Map(rows.map(r => [r.levelId, r.count]));
}

/** List usage levels, optionally filtered to a single `kind`, ordered by sort order then name. */
export async function listLanguageUsageLevels(kind?: LanguageUsageKind): Promise<LanguageUsageLevel[]> {
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(languageUsageLevels)
      .where(kind ? eq(languageUsageLevels.kind, kind) : undefined)
      .orderBy(asc(languageUsageLevels.sortOrder), asc(languageUsageLevels.name)),
    usageCountsByLevel(),
  ]);
  return rows.map(row => toLevel(row, counts.get(row.id) ?? 0));
}

/** Add a usage level. Throws `DuplicateLanguageUsageLevelError` on a name clash within its kind. */
export async function createLanguageUsageLevel(
  input: CreateLanguageUsageLevelInput,
): Promise<LanguageUsageLevel> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateLanguageUsageLevelError(input.name);

  const [clash] = await db
    .select({
      id: languageUsageLevels.id,
    })
    .from(languageUsageLevels)
    .where(and(eq(languageUsageLevels.kind, input.kind), eq(languageUsageLevels.name, name)));
  if (clash) throw new DuplicateLanguageUsageLevelError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "language-usage-level");
  const [row] = await db
    .insert(languageUsageLevels)
    .values({
      name,
      slug,
      kind: input.kind,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return toLevel(row);
}

/** Update a usage level's name and/or sort order (kind is immutable). Built-ins can't be renamed. */
export async function updateLanguageUsageLevel(
  id: string,
  input: UpdateLanguageUsageLevelInput,
): Promise<LanguageUsageLevel | null> {
  const [existing] = await db.select().from(languageUsageLevels).where(eq(languageUsageLevels.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<LanguageUsageLevelRow, "name" | "slug" | "sortOrder">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    if (existing.builtIn) throw new BuiltInLanguageUsageLevelError();
    const name = input.name.trim();
    const [clash] = await db
      .select({
        id: languageUsageLevels.id,
      })
      .from(languageUsageLevels)
      .where(and(eq(languageUsageLevels.kind, existing.kind), eq(languageUsageLevels.name, name)));
    if (clash && clash.id !== id) throw new DuplicateLanguageUsageLevelError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "language-usage-level");
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toLevel(existing);

  const [row] = await db
    .update(languageUsageLevels)
    .set(patch)
    .where(eq(languageUsageLevels.id, id))
    .returning();
  return row ? toLevel(row) : null;
}

/**
 * Delete a usage level. Returns false when not found. Built-ins can't be deleted.
 *
 * When `reassignToId` is given, associations using the deleted level are moved to the target level
 * (colliding rows — where the owner already carries the target level for the same language — are
 * dropped first to respect the unique constraint). Without `reassignToId`, associations referencing
 * the level are deleted (there is no cascade FK). Either way `invalidateBookmarkCache()` is called
 * since bookmark associations may be affected.
 */
export async function deleteLanguageUsageLevel(id: string, reassignToId?: string): Promise<boolean> {
  const [existing] = await db.select().from(languageUsageLevels).where(eq(languageUsageLevels.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInLanguageUsageLevelError();

  if (reassignToId !== undefined) {
    if (reassignToId === id) throw new InvalidUsageLevelReassignError();
    const [target] = await db
      .select()
      .from(languageUsageLevels)
      .where(eq(languageUsageLevels.id, reassignToId));
    if (!target) throw new InvalidUsageLevelReassignError("Reassignment target not found");

    // Drop rows that would collide with an existing target-level row for the same owner+language.
    await db.execute(sql`
      DELETE FROM ${languageUsages} AS lu
      WHERE lu.usage_level_id = ${id}
        AND EXISTS (
          SELECT 1 FROM ${languageUsages} AS other
          WHERE other.usage_level_id = ${reassignToId}
            AND other.owner_type = lu.owner_type
            AND other.owner_id = lu.owner_id
            AND other.language_id = lu.language_id
        )
    `);
    await db
      .update(languageUsages)
      .set({
        usageLevelId: reassignToId,
      })
      .where(eq(languageUsages.usageLevelId, id));
  }
  else {
    await db.delete(languageUsages).where(eq(languageUsages.usageLevelId, id));
  }
  invalidateBookmarkCache();

  const rows = await db
    .delete(languageUsageLevels)
    .where(eq(languageUsageLevels.id, id))
    .returning({
      id: languageUsageLevels.id,
    });
  return rows.length > 0;
}

const isBuiltInLevelError = (err: unknown): boolean => err instanceof BuiltInLanguageUsageLevelError;

/** Delete many usage levels, reporting per-item outcomes (skipping built-ins). */
export function bulkDeleteLanguageUsageLevels(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, id => deleteLanguageUsageLevel(id), isBuiltInLevelError);
}

/** Built-in usage levels seeded on boot — the starting vocabulary for both kinds. */
const BUILT_IN_LEVELS: { name: string;
  kind: LanguageUsageKind; }[] = [
  {
    name: "Dub",
    kind: "availability",
  },
  {
    name: "Subtitles",
    kind: "availability",
  },
  {
    name: "Explanations",
    kind: "availability",
  },
  // A bookmark's main content language is expressed as an availability-kind usage row on this level
  // (there is no dedicated primary-language field). Seeding it also un-breaks the client scan
  // auto-detect, which looks up a level named `PRIMARY_LANGUAGE_LEVEL_NAME` (case-insensitive) and
  // silently no-ops until one exists. The #966 backfill attaches it to Korean/Japanese bookmarks.
  {
    name: "Primary Language",
    kind: "availability",
  },
  {
    name: "Native",
    kind: "proficiency",
  },
  {
    name: "Fluent",
    kind: "proficiency",
  },
  {
    name: "Conversational",
    kind: "proficiency",
  },
  {
    name: "Learning",
    kind: "proficiency",
  },
];

/** Seed the built-in usage levels — idempotent boot step. */
export async function ensureBuiltInLanguageUsageLevels(): Promise<void> {
  let order = 0;
  for (const entry of BUILT_IN_LEVELS) {
    const slug = slugify(entry.name);
    await db
      .insert(languageUsageLevels)
      .values({
        name: entry.name,
        slug,
        kind: entry.kind,
        builtIn: true,
        sortOrder: order,
      })
      .onConflictDoNothing({
        target: languageUsageLevels.slug,
      });
    order += 1;
  }
}

/** Fill in slugs for any usage levels missing one (e.g. rows that predate the `slug` column). */
export async function backfillLanguageUsageLevelSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: languageUsageLevels.id,
      name: languageUsageLevels.name,
    })
    .from(languageUsageLevels)
    .where(isNull(languageUsageLevels.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const level of missing) {
    const slug = uniqueSlug(level.name, taken, "language-usage-level");
    taken.push(slug);
    await db.update(languageUsageLevels).set({
      slug,
    }).where(eq(languageUsageLevels.id, level.id));
  }
}
