import { asc, eq, isNotNull, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateMediaTypeInput,
  MediaType,
  MediaTypeNode,
  UpdateMediaTypeInput,
} from "@eesimple/types";
import { db } from "@/db";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteGenreMoodAssignmentsForOwner } from "@/services/genreMoodAssignments";
import { bookmarks, mediaTypes, type MediaTypeRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing media type name. */
export class DuplicateMediaTypeError extends Error {
  constructor(name: string) {
    super(`A media type named "${name}" already exists`);
    this.name = "DuplicateMediaTypeError";
  }
}

/** Thrown when an update or delete targets a built-in media type in a disallowed way. */
export class BuiltInMediaTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuiltInMediaTypeError";
  }
}

/** Thrown when a parent/child assignment would exceed the single allowed level of nesting. */
export class MediaTypeNestingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaTypeNestingError";
  }
}

/** Distinct-bookmark counts for a media type: across its subtree, and for the type alone. */
interface MediaTypeBookmarkCounts {
  /** Bookmarks carrying this type or any child. */
  subtree: number;
  /** Bookmarks carrying this type directly, not any child (the "No Child" bucket). */
  own: number;
}

/** A root media type seeded at boot, with optional built-in children nested one level under it. */
interface BuiltInMediaType {
  name: string;
  /** Lucide icon name (PascalCase), rendered by the client's `CategoryIcon`. */
  icon: string;
  children?: BuiltInMediaType[];
}

/**
 * The seeded built-in vocabulary, in display order. A single level of nesting only: Audio and
 * Document carry children; everything else is a leaf root.
 */
const BUILT_IN_MEDIA_TYPES: BuiltInMediaType[] = [
  {
    name: "Video",
    icon: "Video",
  },
  {
    name: "Video Game",
    icon: "Gamepad2",
  },
  {
    name: "Audio",
    icon: "AudioLines",
    children: [
      {
        name: "Podcast",
        icon: "Podcast",
      },
      {
        name: "Music",
        icon: "Music",
      },
      {
        name: "Interview",
        icon: "Mic",
      },
    ],
  },
  {
    name: "Document",
    icon: "FileText",
    children: [
      {
        name: "Article",
        icon: "Newspaper",
      },
    ],
  },
  {
    name: "Image",
    icon: "Image",
  },
  {
    name: "Book",
    icon: "BookOpen",
  },
  {
    name: "Website/App",
    icon: "Globe",
  },
  {
    name: "Social Media Post",
    icon: "Share2",
  },
  {
    name: "Other",
    icon: "Shapes",
  },
];

/** Map a DB row (plus optional precomputed counts) to the shared `MediaType` wire type. */
function toMediaType(
  row: MediaTypeRow,
  counts?: MediaTypeBookmarkCounts,
): MediaType {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
    slug: row.slug ?? slugify(row.name),
    icon: row.icon ?? null,
    builtIn: row.builtIn,
    sortOrder: row.sortOrder,
    parentId: row.parentId,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: counts?.subtree,
    ownBookmarkCount: counts?.own,
  };
}

/** Build a parent→children id map from a flat media-type list. Pure helper. */
function buildChildrenByParent(
  all: { id: string;
    parentId: string | null; }[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const mt of all) {
    if (!mt.parentId) continue;
    const siblings = map.get(mt.parentId) ?? [];
    siblings.push(mt.id);
    map.set(mt.parentId, siblings);
  }
  return map;
}

/**
 * Compute each media type's subtree and own bookmark counts. A media type is single-valued on a
 * bookmark (`bookmarks.mediaTypeId`), so no dedup is needed: own is the direct count and subtree
 * adds the direct counts of all descendants. Pure — operates on in-memory data for unit testing.
 */
export function computeMediaTypeBookmarkCounts(
  all: { id: string;
    parentId: string | null; }[],
  bookmarkMediaTypeIds: (string | null)[],
): Map<string, MediaTypeBookmarkCounts> {
  const directCount = new Map<string, number>(all.map(mt => [mt.id, 0]));
  for (const id of bookmarkMediaTypeIds) {
    if (id === null) continue;
    directCount.set(id, (directCount.get(id) ?? 0) + 1);
  }

  const childrenByParent = buildChildrenByParent(all);
  const result = new Map<string, MediaTypeBookmarkCounts>();
  for (const mt of all) {
    const own = directCount.get(mt.id) ?? 0;
    let subtree = own;
    const stack = [...(childrenByParent.get(mt.id) ?? [])];
    while (stack.length > 0) {
      const id = stack.pop()!;
      subtree += directCount.get(id) ?? 0;
      for (const child of childrenByParent.get(id) ?? []) stack.push(child);
    }
    result.set(mt.id, {
      subtree,
      own,
    });
  }
  return result;
}

/**
 * Build a nested tree from a flat media-type list (roots first). Pure — kept separate from DB
 * access so it can be unit-tested with in-memory data.
 */
export function buildMediaTypeTree(all: MediaType[]): MediaTypeNode[] {
  const byId = new Map<string, MediaTypeNode>(all.map(mt => [mt.id, {
    ...mt,
    children: [],
  }]));
  const roots: MediaTypeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Existing media-type slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(mediaTypes, mediaTypes.slug, mediaTypes.id, excludeId);

/**
 * Enforce the single allowed level of nesting: a non-null parent must reference an existing
 * media type that is itself a root (its own `parentId` is null). Throws `MediaTypeNestingError`
 * otherwise (or when the parent does not exist).
 */
async function assertParentIsRoot(parentId: string): Promise<void> {
  const [parent] = await db
    .select({
      parentId: mediaTypes.parentId,
    })
    .from(mediaTypes)
    .where(eq(mediaTypes.id, parentId));
  if (!parent) throw new MediaTypeNestingError("Parent media type not found");
  if (parent.parentId !== null) {
    throw new MediaTypeNestingError("Media types can only be nested one level deep");
  }
}

/** Whether a media type currently has any children (so it can't itself become a child). */
async function hasChildren(id: string): Promise<boolean> {
  const [child] = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(eq(mediaTypes.parentId, id));
  return child !== undefined;
}

/** List all media types, ordered by their display order then name, with bookmark counts. */
export async function listMediaTypes(): Promise<MediaType[]> {
  const rows = await db
    .select()
    .from(mediaTypes)
    .orderBy(asc(mediaTypes.sortOrder), asc(mediaTypes.name));
  const links = await db
    .select({
      mediaTypeId: bookmarks.mediaTypeId,
    })
    .from(bookmarks)
    .where(isNotNull(bookmarks.mediaTypeId));
  const counts = computeMediaTypeBookmarkCounts(
    rows,
    links.map(l => l.mediaTypeId),
  );
  return rows.map(row => toMediaType(row, counts.get(row.id)));
}

/** The full media-type taxonomy as a nested tree (roots first). */
export async function getMediaTypeTree(): Promise<MediaTypeNode[]> {
  return buildMediaTypeTree(await listMediaTypes());
}

/** Fetch a media type by its slug, or `null` when absent. */
export async function getMediaTypeBySlug(slug: string): Promise<MediaType | null> {
  const [row] = await db.select().from(mediaTypes).where(eq(mediaTypes.slug, slug));
  return row ? toMediaType(row) : null;
}

/** Add a custom media type. Throws `DuplicateMediaTypeError` on a name clash. */
export async function createMediaType(input: CreateMediaTypeInput): Promise<MediaType> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateMediaTypeError(input.name);

  const [clash] = await db.select({
    id: mediaTypes.id,
  }).from(mediaTypes).where(eq(mediaTypes.name, name));
  if (clash) throw new DuplicateMediaTypeError(name);

  const parentId = input.parentId ?? null;
  if (parentId !== null) await assertParentIsRoot(parentId);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(mediaTypes).values({
    name,
    romanizedName: input.romanizedName ?? null,
    slug,
    icon: input.icon ?? null,
    parentId,
    sortOrder: input.sortOrder ?? BUILT_IN_MEDIA_TYPES.length,
  }).returning();
  return toMediaType(row);
}

/** Rename, reorder, and/or reparent a media type. Built-ins cannot be renamed. */
export async function updateMediaType(
  id: string,
  input: UpdateMediaTypeInput,
): Promise<MediaType | null> {
  const [existing] = await db.select().from(mediaTypes).where(eq(mediaTypes.id, id));
  if (!existing) return null;
  if (existing.builtIn && input.name !== undefined && input.name.trim() !== existing.name) {
    throw new BuiltInMediaTypeError("A built-in media type cannot be renamed");
  }

  const patch: Partial<Pick<MediaTypeRow, "name" | "romanizedName" | "slug" | "sortOrder" | "icon" | "parentId">> = {};
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName ?? null;
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: mediaTypes.id,
    }).from(mediaTypes).where(eq(mediaTypes.name, name));
    if (clash && clash.id !== id) throw new DuplicateMediaTypeError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.parentId !== undefined) {
    const parentId = input.parentId;
    if (parentId !== null) {
      if (parentId === id) {
        throw new MediaTypeNestingError("A media type cannot be its own parent");
      }
      if (await hasChildren(id)) {
        throw new MediaTypeNestingError(
          "This media type has children, so it can't become a child itself",
        );
      }
      await assertParentIsRoot(parentId);
    }
    patch.parentId = parentId;
  }
  if (Object.keys(patch).length === 0) return toMediaType(existing);

  const [row] = await db.update(mediaTypes).set(patch).where(eq(mediaTypes.id, id)).returning();
  return row ? toMediaType(row) : null;
}

/** Delete a media type. Built-ins cannot be deleted. Bookmarks pointing at it are set to NULL. */
export async function deleteMediaType(id: string): Promise<boolean> {
  const [existing] = await db.select({
    builtIn: mediaTypes.builtIn,
  }).from(mediaTypes).where(eq(mediaTypes.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInMediaTypeError("A built-in media type cannot be deleted");
  const rows = await db.delete(mediaTypes).where(eq(mediaTypes.id, id)).returning({
    id: mediaTypes.id,
  });
  // The FK sets bookmarks.mediaTypeId to NULL — matchable data (media-type condition leaves).
  if (rows.length > 0) {
    // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
    await deleteGenreMoodAssignmentsForOwner("mediaType", id);
    invalidateBookmarkCache();
  }
  return rows.length > 0;
}

/** Delete many media types, reporting per-item outcomes (built-ins are skipped). */
export function bulkDeleteMediaTypes(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteMediaType, err => err instanceof BuiltInMediaTypeError);
}

/** Insert a built-in media type by slug if missing, returning the existing or new row's id. */
async function ensureBuiltIn(
  name: string,
  icon: string,
  sortOrder: number,
  parentId: string | null,
): Promise<string> {
  const slug = slugify(name);
  await db
    .insert(mediaTypes)
    .values({
      name,
      slug,
      icon,
      builtIn: true,
      sortOrder,
      parentId,
    })
    .onConflictDoNothing({
      target: mediaTypes.slug,
    });
  const [row] = await db
    .select({
      id: mediaTypes.id,
      icon: mediaTypes.icon,
    })
    .from(mediaTypes)
    .where(eq(mediaTypes.slug, slug));
  // Backfill the icon for legacy built-ins seeded before icons existed. Only when it's still null,
  // so a user's custom icon choice is never clobbered.
  if (row.icon === null) {
    await db
      .update(mediaTypes)
      .set({
        icon,
      })
      .where(eq(mediaTypes.id, row.id));
  }
  return row.id;
}

/**
 * Ensure the seeded built-in media types exist. Idempotent and safe to call at boot: inserts any
 * missing built-in by slug, then nests the built-in children one level under their parent. Existing
 * installs whose Podcast/Article were top-level roots are re-parented under Audio/Document (slugs
 * are unchanged, so bookmarks keep pointing at them). The whole step is idempotent.
 */
export async function ensureBuiltInMediaTypes(): Promise<void> {
  // Insert roots first so children can reference them.
  let order = 0;
  const rootIdByName = new Map<string, string>();
  for (const root of BUILT_IN_MEDIA_TYPES) {
    rootIdByName.set(root.name, await ensureBuiltIn(root.name, root.icon, order, null));
    order += 1;
  }
  // Then insert/re-parent children one level under their root.
  for (const root of BUILT_IN_MEDIA_TYPES) {
    if (!root.children) continue;
    const parentId = rootIdByName.get(root.name)!;
    for (const child of root.children) {
      const childId = await ensureBuiltIn(child.name, child.icon, order, parentId);
      order += 1;
      // Re-parent legacy installs where the child was created as a top-level root.
      await db
        .update(mediaTypes)
        .set({
          parentId,
        })
        .where(eq(mediaTypes.id, childId));
    }
  }
}

/** Fill in slugs for any media types missing one (e.g. rows that predate the `slug` column). */
export async function backfillMediaTypeSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: mediaTypes.id,
      name: mediaTypes.name,
    })
    .from(mediaTypes)
    .where(isNull(mediaTypes.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const mt of missing) {
    const slug = uniqueSlug(mt.name, taken);
    taken.push(slug);
    await db.update(mediaTypes).set({
      slug,
    }).where(eq(mediaTypes.id, mt.id));
  }
}
