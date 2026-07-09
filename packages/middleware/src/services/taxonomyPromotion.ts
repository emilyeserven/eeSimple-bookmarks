import { and, eq, inArray, ne, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Taxonomy } from "@eesimple/types";
import { db } from "@/db";
import type { Tx } from "@/services/bookmarkWrites";
import {
  bookmarkTags,
  bookmarkTagBlacklist,
  autofillRuleTags,
  entityNames,
  homepageTags,
  locationTags,
  newsletterTags,
  tags,
  taxonomies,
  taxonomyAssignments,
  taxonomyTerms,
  websiteTags,
  youtubeChannelTags,
} from "@/db/schema";
import { getTaxonomy } from "@/services/taxonomies";
import { getDescendantIds } from "@/services/tags";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { AppError } from "@/utils/errors";
import { uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a promote/demote is blocked by references that v1 doesn't migrate. */
export class TaxonomyConversionError extends AppError {
  constructor(message: string) {
    super(message, "conflict", 422);
  }
}

/** Count rows of `table` whose tag column is one of `ids`. */
async function countTagRefs(table: PgTable, tagColumn: PgColumn, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const [row] = await db
    .select({
      n: sql<number>`count(*)::int`,
    })
    .from(table)
    .where(inArray(tagColumn, ids));
  return row?.n ?? 0;
}

/**
 * Reject promotion when the subtree is referenced by a default-assignment join v1 doesn't migrate
 * (websites/channels/newsletters/locations/homepage/autofill/blacklist) or when the root tag itself
 * carries direct bookmarks (there's no term for the root). Descendant `bookmark_tags` ARE migrated,
 * so they aren't blockers.
 */
async function assertTagsPromotable(
  rootTag: { id: string;
    name: string; },
  subtreeIds: string[],
): Promise<void> {
  const checks: [PgTable, PgColumn, string][] = [
    [websiteTags, websiteTags.tagId, "website default tags"],
    [youtubeChannelTags, youtubeChannelTags.tagId, "YouTube channel default tags"],
    [newsletterTags, newsletterTags.tagId, "import default tags"],
    [locationTags, locationTags.tagId, "location tags"],
    [homepageTags, homepageTags.tagId, "homepage section tags"],
    [autofillRuleTags, autofillRuleTags.tagId, "autofill rule tags"],
    [bookmarkTagBlacklist, bookmarkTagBlacklist.tagId, "bookmark tag blacklists"],
  ];
  const blockers: string[] = [];
  for (const [table, col, label] of checks) {
    if (await countTagRefs(table, col, subtreeIds) > 0) blockers.push(label);
  }
  const rootBookmarks = await countTagRefs(bookmarkTags, bookmarkTags.tagId, [rootTag.id]);
  if (rootBookmarks > 0) {
    blockers.push(`the "${rootTag.name}" tag is directly on ${rootBookmarks} bookmark(s) — retag them to a child tag first`);
  }
  if (blockers.length > 0) {
    throw new TaxonomyConversionError(`Cannot promote this tag: still referenced by ${blockers.join(", ")}.`);
  }
}

/** Insert one taxonomy term per descendant tag (two-pass: create flat, then wire parents). */
async function insertTermsFromTags(
  tx: Tx,
  taxonomyId: string,
  rootTagId: string,
  descendants: { id: string;
    name: string;
    parentId: string | null; }[],
): Promise<Map<string, string>> {
  const termIdByTag = new Map<string, string>();
  const takenTermSlugs: string[] = [];
  for (const tag of descendants) {
    const slug = uniqueSlug(tag.name, takenTermSlugs, "term");
    takenTermSlugs.push(slug);
    const [term] = await tx
      .insert(taxonomyTerms)
      .values({
        taxonomyId,
        name: tag.name,
        slug,
        parentId: null,
      })
      .returning({
        id: taxonomyTerms.id,
      });
    termIdByTag.set(tag.id, term.id);
  }
  for (const tag of descendants) {
    if (tag.parentId && tag.parentId !== rootTagId) {
      const parentTermId = termIdByTag.get(tag.parentId);
      const termId = termIdByTag.get(tag.id);
      if (parentTermId && termId) {
        await tx.update(taxonomyTerms).set({
          parentId: parentTermId,
        }).where(eq(taxonomyTerms.id, termId));
      }
    }
  }
  return termIdByTag;
}

/** Remove the leftover owner-side rows (no cascade FK) for a set of now-deleted tags. */
async function cleanupTagOwnerRows(tx: Tx, ownerIds: string[]): Promise<void> {
  if (ownerIds.length === 0) return;
  await tx.delete(taxonomyAssignments).where(and(
    eq(taxonomyAssignments.ownerType, "tag"),
    inArray(taxonomyAssignments.ownerId, ownerIds),
  ));
  await tx.delete(entityNames).where(and(
    eq(entityNames.ownerType, "tag"),
    inArray(entityNames.ownerId, ownerIds),
  ));
}

/**
 * Promote a tag subtree into its own taxonomy: the tag becomes the taxonomy; its descendant tags
 * become terms (structure preserved); each descendant's `bookmark_tags` migrate to
 * `taxonomy_assignments`; the promoted tags + their `bookmark_tags` are deleted. Returns the new
 * taxonomy, or `null` if the tag wasn't found. Throws {@link TaxonomyConversionError} on a blocker.
 */
export async function promoteTagToTaxonomy(tagId: string): Promise<Taxonomy | null> {
  const [rootTag] = await db.select().from(tags).where(eq(tags.id, tagId));
  if (!rootTag) return null;

  const subtreeIds = [...await getDescendantIds(tagId)];
  const descendantIds = subtreeIds.filter(id => id !== tagId);
  await assertTagsPromotable(rootTag, subtreeIds);

  const descendants = descendantIds.length > 0
    ? await db
      .select({
        id: tags.id,
        name: tags.name,
        parentId: tags.parentId,
      })
      .from(tags)
      .where(inArray(tags.id, descendantIds))
    : [];

  const slug = uniqueSlug(rootTag.name, await takenSlugsOf(taxonomies, taxonomies.slug, taxonomies.id), "taxonomy");

  const created = await db.transaction(async (tx) => {
    const [taxonomy] = await tx
      .insert(taxonomies)
      .values({
        name: rootTag.name,
        slug,
        hierarchical: true,
        singleValue: false,
      })
      .returning();

    const termIdByTag = await insertTermsFromTags(tx, taxonomy.id, tagId, descendants);

    if (descendantIds.length > 0) {
      const links = await tx
        .select({
          bookmarkId: bookmarkTags.bookmarkId,
          tagId: bookmarkTags.tagId,
        })
        .from(bookmarkTags)
        .where(inArray(bookmarkTags.tagId, descendantIds));
      const values = links
        .map(link => ({
          taxonomyId: taxonomy.id,
          termId: termIdByTag.get(link.tagId),
          ownerType: "bookmark" as const,
          ownerId: link.bookmarkId,
        }))
        .filter((v): v is { taxonomyId: string;
          termId: string;
          ownerType: "bookmark";
          ownerId: string; } => Boolean(v.termId));
      if (values.length > 0) await tx.insert(taxonomyAssignments).values(values).onConflictDoNothing();
    }

    // Delete the promoted subtree (cascade removes descendant tags + their bookmark_tags), then the
    // owner-side rows that carry no cascade FK.
    await tx.delete(tags).where(eq(tags.id, tagId));
    await cleanupTagOwnerRows(tx, subtreeIds);
    return taxonomy;
  });

  invalidateBookmarkCache();
  return getTaxonomy(created.id);
}

/** Insert one tag per term (two-pass), all initially under `parentTagId`, then wire term parents. */
async function insertTagsFromTerms(
  tx: Tx,
  parentTagId: string,
  terms: { id: string;
    name: string;
    parentId: string | null; }[],
  takenTagSlugs: string[],
): Promise<Map<string, string>> {
  const tagIdByTerm = new Map<string, string>();
  for (const term of terms) {
    const slug = uniqueSlug(term.name, takenTagSlugs, "tag");
    takenTagSlugs.push(slug);
    const [tag] = await tx
      .insert(tags)
      .values({
        name: term.name,
        slug,
        parentId: parentTagId,
      })
      .returning({
        id: tags.id,
      });
    tagIdByTerm.set(term.id, tag.id);
  }
  for (const term of terms) {
    if (term.parentId) {
      const parentId = tagIdByTerm.get(term.parentId);
      const tagId = tagIdByTerm.get(term.id);
      if (parentId && tagId) {
        await tx.update(tags).set({
          parentId,
        }).where(eq(tags.id, tagId));
      }
    }
  }
  return tagIdByTerm;
}

/**
 * Demote a taxonomy back into Tags: a parent tag (new, or the provided `parentTagId`) gets the
 * taxonomy's terms as child tags (structure preserved); bookmark assignments migrate to
 * `bookmark_tags`; the taxonomy + terms + assignments are deleted. Refuses to demote a **built-in**
 * taxonomy, and refuses when the taxonomy has non-bookmark assignments (no tag equivalent). Returns
 * the parent tag id, or `null` if the taxonomy wasn't found.
 */
export async function demoteTaxonomy(
  taxonomyId: string,
  parentTagId?: string | null,
): Promise<{ parentTagId: string } | null> {
  const [taxonomy] = await db.select().from(taxonomies).where(eq(taxonomies.id, taxonomyId));
  if (!taxonomy) return null;
  if (taxonomy.builtIn) {
    throw new TaxonomyConversionError("Built-in taxonomies can't be demoted to tags.");
  }

  const [nonBookmark] = await db
    .select({
      n: sql<number>`count(*)::int`,
    })
    .from(taxonomyAssignments)
    .where(and(
      eq(taxonomyAssignments.taxonomyId, taxonomyId),
      ne(taxonomyAssignments.ownerType, "bookmark"),
    ));
  if ((nonBookmark?.n ?? 0) > 0) {
    throw new TaxonomyConversionError(
      `Cannot demote this taxonomy: ${nonBookmark.n} term assignment(s) are on non-bookmark entities, which have no tag equivalent. Remove them first.`,
    );
  }

  const terms = await db
    .select({
      id: taxonomyTerms.id,
      name: taxonomyTerms.name,
      parentId: taxonomyTerms.parentId,
    })
    .from(taxonomyTerms)
    .where(eq(taxonomyTerms.taxonomyId, taxonomyId));

  const takenTagSlugs = await takenSlugsOf(tags, tags.slug, tags.id);

  const resultParentId = await db.transaction(async (tx) => {
    let parentId = parentTagId ?? null;
    if (!parentId) {
      const slug = uniqueSlug(taxonomy.name, takenTagSlugs, "tag");
      takenTagSlugs.push(slug);
      const [parentTag] = await tx
        .insert(tags)
        .values({
          name: taxonomy.name,
          slug,
          parentId: null,
        })
        .returning({
          id: tags.id,
        });
      parentId = parentTag.id;
    }

    const tagIdByTerm = await insertTagsFromTerms(tx, parentId, terms, takenTagSlugs);

    const assignments = await tx
      .select({
        ownerId: taxonomyAssignments.ownerId,
        termId: taxonomyAssignments.termId,
      })
      .from(taxonomyAssignments)
      .where(and(
        eq(taxonomyAssignments.taxonomyId, taxonomyId),
        eq(taxonomyAssignments.ownerType, "bookmark"),
      ));
    const values = assignments
      .map(a => ({
        bookmarkId: a.ownerId,
        tagId: tagIdByTerm.get(a.termId),
      }))
      .filter((v): v is { bookmarkId: string;
        tagId: string; } => Boolean(v.tagId));
    if (values.length > 0) await tx.insert(bookmarkTags).values(values).onConflictDoNothing();

    // Cascade removes terms + value-side assignment rows.
    await tx.delete(taxonomies).where(eq(taxonomies.id, taxonomyId));
    return parentId;
  });

  invalidateBookmarkCache();
  return {
    parentTagId: resultParentId,
  };
}
