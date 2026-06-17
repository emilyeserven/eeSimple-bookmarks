import { eq } from "drizzle-orm";
import type { ConditionNode, ConditionTree, HomepageFilter } from "@eesimple/types";
import { emptyConditionTree } from "@eesimple/types";
import { db } from "@/db";
import { categories, homepageFilter, homepageTags } from "@/db/schema";

// The homepage filter is a singleton; it always lives in row id = 1.
const ROW_ID = 1;

/** Read the global homepage filter, defaulting to an empty (matches-nothing) tree. */
export async function getHomepageFilter(): Promise<HomepageFilter> {
  const [row] = await db.select().from(homepageFilter).where(eq(homepageFilter.id, ROW_ID));
  return {
    conditions: row?.conditions ?? emptyConditionTree(),
  };
}

/** Replace the global homepage filter. */
export async function setHomepageFilter(conditions: ConditionTree): Promise<HomepageFilter> {
  await db
    .insert(homepageFilter)
    .values({
      id: ROW_ID,
      conditions,
    })
    .onConflictDoUpdate({
      target: homepageFilter.id,
      set: {
        conditions,
      },
    });
  return {
    conditions,
  };
}

/**
 * Seed the singleton homepage filter on first boot. If no row exists yet, build an initial tree
 * from the legacy `categories.is_homepage` flags and the `homepage_tags` allowlist so existing
 * homepages keep working after the switch to condition-based filtering. Idempotent.
 */
export async function ensureHomepageFilter(): Promise<void> {
  const [existing] = await db
    .select({
      id: homepageFilter.id,
    })
    .from(homepageFilter)
    .where(eq(homepageFilter.id, ROW_ID));
  if (existing) return;

  const children: ConditionNode[] = [];

  const homepageCategories = await db
    .select({
      id: categories.id,
    })
    .from(categories)
    .where(eq(categories.isHomepage, true));
  if (homepageCategories.length > 0) {
    children.push({
      type: "category",
      categoryIds: homepageCategories.map(row => row.id),
    });
  }

  const tagRows = await db
    .select({
      tagId: homepageTags.tagId,
    })
    .from(homepageTags);
  if (tagRows.length > 0) {
    children.push({
      type: "tag",
      tagIds: tagRows.map(row => row.tagId),
    });
  }

  await db
    .insert(homepageFilter)
    .values({
      id: ROW_ID,
      conditions: {
        type: "group",
        combinator: "or",
        children,
      },
    })
    .onConflictDoNothing();
}
