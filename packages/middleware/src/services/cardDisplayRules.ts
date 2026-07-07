import { and, asc, eq, sql } from "drizzle-orm";
import type {
  BookmarkImageVisibility,
  CardDisplayRule,
  CreateCardDisplayRuleInput,
  HomepageSectionImageLayout,
  UpdateCardDisplayRuleInput,
} from "@eesimple/types";
import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";
import { db } from "@/db";
import { cardDisplayRules } from "@/db/schema";
import { defaultFieldZones } from "@/services/cardDisplayDefaults";
import { uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type RuleRow = typeof cardDisplayRules.$inferSelect;

/** Slugs already in use on the rules table, optionally excluding one row (when renaming it). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(cardDisplayRules, cardDisplayRules.slug, cardDisplayRules.id, excludeId);

function toRule(row: RuleRow): CardDisplayRule {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    conditions: row.conditions,
    sortOrder: row.sortOrder,
    isDefault: row.isDefault,
    fieldZones: row.fieldZones ?? null,
    cardZoneLayouts: row.cardZoneLayouts ?? null,
    imageMode: row.imageMode ?? null,
    imageVisibility: (row.imageVisibility as BookmarkImageVisibility | null) ?? null,
    imageLayout: (row.imageLayout as HomepageSectionImageLayout | null) ?? null,
    hideWebsiteForYouTube: row.hideWebsiteForYouTube ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/**
 * List all card display rules. Non-default rules come first, ordered by `sortOrder` ASC; the Default
 * rule (lowest priority) is pinned last via the `isDefault` sort key.
 */
export async function listCardDisplayRules(): Promise<CardDisplayRule[]> {
  const rows = await db
    .select()
    .from(cardDisplayRules)
    .orderBy(
      asc(cardDisplayRules.isDefault),
      asc(cardDisplayRules.sortOrder),
      asc(cardDisplayRules.createdAt),
    );
  return rows.map(toRule);
}

/** Create a new (non-default) card display rule. sortOrder defaults to one more than the current max. */
export async function createCardDisplayRule(
  input: CreateCardDisplayRuleInput,
): Promise<CardDisplayRule> {
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const [{
      max,
    }] = await db
      .select({
        max: sql<number>`COALESCE(MAX(${cardDisplayRules.sortOrder}), -1)`,
      })
      .from(cardDisplayRules)
      .where(eq(cardDisplayRules.isDefault, false));
    sortOrder = (max ?? -1) + 1;
  }
  const [row] = await db
    .insert(cardDisplayRules)
    .values({
      name: input.name,
      slug: uniqueSlug(input.name, await takenSlugs(), "card-display-rule"),
      description: input.description ?? null,
      conditions: input.conditions,
      sortOrder,
      isDefault: false,
      fieldZones: input.fieldZones ?? null,
      cardZoneLayouts: input.cardZoneLayouts ?? null,
      imageMode: input.imageMode ?? null,
      imageVisibility: input.imageVisibility ?? null,
      imageLayout: input.imageLayout ?? null,
      hideWebsiteForYouTube: input.hideWebsiteForYouTube ?? null,
    })
    .returning();
  return toRule(row);
}

/**
 * Partially update a card display rule. Guards on `!== undefined` so an explicit `null` persists as
 * "inherit" rather than being skipped. Returns null when the id is not found.
 */
export async function updateCardDisplayRule(
  id: string,
  input: UpdateCardDisplayRuleInput,
): Promise<CardDisplayRule | null> {
  const updates: Partial<typeof cardDisplayRules.$inferInsert> = {};
  if (input.name !== undefined) {
    updates.name = input.name;
    updates.slug = uniqueSlug(input.name, await takenSlugs(id), "card-display-rule");
  }
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.conditions !== undefined) updates.conditions = input.conditions;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
  if (input.fieldZones !== undefined) updates.fieldZones = input.fieldZones;
  if (input.cardZoneLayouts !== undefined) updates.cardZoneLayouts = input.cardZoneLayouts;
  if (input.imageMode !== undefined) updates.imageMode = input.imageMode;
  if (input.imageVisibility !== undefined) updates.imageVisibility = input.imageVisibility;
  if (input.imageLayout !== undefined) updates.imageLayout = input.imageLayout;
  if (input.hideWebsiteForYouTube !== undefined) updates.hideWebsiteForYouTube = input.hideWebsiteForYouTube;

  if (Object.keys(updates).length === 0) {
    const [existing] = await db
      .select()
      .from(cardDisplayRules)
      .where(eq(cardDisplayRules.id, id));
    return existing ? toRule(existing) : null;
  }

  const [row] = await db
    .update(cardDisplayRules)
    .set(updates)
    .where(eq(cardDisplayRules.id, id))
    .returning();
  return row ? toRule(row) : null;
}

/**
 * Delete a card display rule by id. Refuses to delete the Default rule (returns false); returns true
 * when a non-default rule was deleted, false when the id was absent or pointed at the Default rule.
 */
export async function deleteCardDisplayRule(id: string): Promise<boolean> {
  const deleted = await db
    .delete(cardDisplayRules)
    .where(and(eq(cardDisplayRules.id, id), eq(cardDisplayRules.isDefault, false)))
    .returning({
      id: cardDisplayRules.id,
    });
  return deleted.length > 0;
}

/**
 * Reorder the non-default card display rules. Accepts an ordered list of ids and writes each rule's
 * `sortOrder` as its index position. The Default rule keeps its own `sortOrder` (always pinned last
 * by the `isDefault` sort key) and any default id in the list is ignored.
 */
export async function reorderCardDisplayRules(orderedIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(cardDisplayRules)
        .set({
          sortOrder: i,
        })
        .where(and(eq(cardDisplayRules.id, orderedIds[i]), eq(cardDisplayRules.isDefault, false)));
    }
  });
}

/**
 * Seed the singleton Default card display rule on boot. Idempotent — inserts the baseline row only
 * when no default rule exists. Its display config is fully concrete (the baseline every card falls
 * back to) and its `conditions` are empty (the resolver treats the Default as an unconditional match).
 */
export async function ensureDefaultCardDisplayRule(): Promise<void> {
  const [{
    count,
  }] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(cardDisplayRules)
    .where(eq(cardDisplayRules.isDefault, true));
  if (Number(count) > 0) return;

  await db.insert(cardDisplayRules).values({
    name: "Default",
    slug: uniqueSlug("Default", await takenSlugs(), "card-display-rule"),
    description: null,
    conditions: emptyConditionTree(),
    // Pinned last regardless; a high sortOrder keeps it last even if isDefault sorting changes.
    sortOrder: 1_000_000,
    isDefault: true,
    fieldZones: defaultFieldZones(),
    cardZoneLayouts: defaultCardZoneLayouts(),
    imageMode: "natural",
    imageVisibility: "shown",
    imageLayout: "above",
    hideWebsiteForYouTube: false,
  });
}
