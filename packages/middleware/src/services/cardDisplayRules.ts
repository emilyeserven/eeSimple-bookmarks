import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type {
  BookmarkImageVisibility,
  CardDisplayRule,
  CardFieldPlacement,
  CardFieldZone,
  CardZoneLayout,
  CardZoneLayouts,
  CreateCardDisplayRuleInput,
  HomepageSectionImageLayout,
  UpdateCardDisplayRuleInput,
} from "@eesimple/types";
import type { CardFieldZones } from "@eesimple/types";
import { CARD_BODY_ZONES, CARD_FIELD_ZONES, defaultCardZoneLayouts, emptyCardFieldZones, emptyConditionTree, normalizeCardZoneLayout } from "@eesimple/types";
import { db } from "@/db";
import { cardDisplayRules, customProperties, propertyCategories } from "@/db/schema";
import { defaultBodyZone, defaultFieldZones, HEADER_CARD_FIELD_KEYS, STANDARD_CARD_FIELD_KEYS } from "@/services/cardDisplayDefaults";
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
      slug: uniqueSlug(input.name, await takenSlugs()),
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
    updates.slug = uniqueSlug(input.name, await takenSlugs(id));
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
    slug: uniqueSlug("Default", await takenSlugs()),
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

/** Map a legacy `card_image_corner` string to its image {@link CardFieldZone}, or `null` if unset/invalid. */
function legacyCornerToZone(corner: string | null): CardFieldZone | null {
  switch (corner) {
    case "top-left": return "image-top-left";
    case "top-right": return "image-top-right";
    case "bottom-left": return "image-bottom-left";
    case "bottom-right": return "image-bottom-right";
    default: return null;
  }
}

/** A custom property's legacy corner placement + eligibility, read straight from the DB for backfill. */
interface LegacyPropertyPlacement {
  id: string;
  eligible: boolean;
  zone: CardFieldZone;
  placement: CardFieldPlacement;
}

/**
 * One-time boot backfill: populate `field_zones` for rules that predate it from the legacy
 * `hidden_card_fields` (rule) + per-property `card_image_corner*` columns. Idempotent — only rules
 * whose `field_zones IS NULL` are touched; a non-default rule that was inheriting (`hidden_card_fields
 * = NULL`) stays inheriting (`field_zones` left NULL). Must run after `ensureDefaultCardDisplayRule`.
 */
export async function backfillCardDisplayRuleFieldZones(): Promise<void> {
  const pending = await db
    .select()
    .from(cardDisplayRules)
    .where(isNull(cardDisplayRules.fieldZones));
  if (pending.length === 0) return;

  // Load each custom property's eligibility (mirrors the client's card-field filter) + legacy corner.
  const propRows = await db
    .select({
      id: customProperties.id,
      type: customProperties.type,
      showInListings: customProperties.showInListings,
      allCategories: customProperties.allCategories,
      cardImageCorner: customProperties.cardImageCorner,
      cardImageCornerScale: customProperties.cardImageCornerScale,
      cardImageCornerMobileScale: customProperties.cardImageCornerMobileScale,
      cardImageCornerHideLabel: customProperties.cardImageCornerHideLabel,
    })
    .from(customProperties);
  const categorizedIds = new Set(
    (await db
      .selectDistinct({
        propertyId: propertyCategories.propertyId,
      })
      .from(propertyCategories))
      .map(row => row.propertyId),
  );

  const placements: LegacyPropertyPlacement[] = propRows.map((row) => {
    // An unset/invalid corner means the property lives in the card body (its label/badge form).
    const cornerZone = legacyCornerToZone(row.cardImageCorner);
    const zone = cornerZone ?? defaultBodyZone(row.id);
    const placement: CardFieldPlacement = {
      key: row.id,
    };
    if (cornerZone) {
      if (row.cardImageCornerScale != null) placement.scale = row.cardImageCornerScale;
      if (row.cardImageCornerMobileScale != null) placement.mobileScale = row.cardImageCornerMobileScale;
      if (row.cardImageCornerHideLabel) placement.hideLabel = true;
    }
    return {
      id: row.id,
      eligible: row.showInListings
        && row.type !== "calculate"
        && (row.allCategories || categorizedIds.has(row.id)),
      zone,
      placement,
    };
  });

  for (const rule of pending) {
    // A non-default rule that was inheriting stays inheriting.
    if (!rule.isDefault && rule.hiddenCardFields == null) continue;

    const hidden = new Set(rule.hiddenCardFields ?? []);
    const zones = emptyCardFieldZones();
    for (const key of STANDARD_CARD_FIELD_KEYS) {
      if (!hidden.has(key)) zones[defaultBodyZone(key)].push({
        key,
      });
    }
    for (const prop of placements) {
      if (!prop.eligible || hidden.has(prop.id)) continue;
      zones[prop.zone].push(prop.placement);
    }
    await db
      .update(cardDisplayRules)
      .set({
        fieldZones: zones,
      })
      .where(eq(cardDisplayRules.id, rule.id));
  }
}

/**
 * One-time boot backfill: migrate rules whose stored `field_zones` still use the legacy single `card`
 * body zone into the four sub-zones. All `card` placements move into `card-labels` (the pill form),
 * preserving order; image-corner zones are kept as-is. Idempotent — a rule with no `card` key is left
 * untouched. Must run after `ensureDefaultCardDisplayRule`/`backfillCardDisplayRuleFieldZones`.
 */
export async function backfillCardDisplayRuleSubZones(): Promise<void> {
  const rows = await db.select().from(cardDisplayRules);
  for (const row of rows) {
    const stored = row.fieldZones as Record<string, CardFieldPlacement[]> | null;
    // Nothing to migrate: inheriting rule, or already on the new sub-zone shape.
    if (!stored || !Array.isArray(stored.card)) continue;

    const next = emptyCardFieldZones();
    // Carry over every zone that already uses the new shape (image corners + any new body zones).
    for (const zone of CARD_FIELD_ZONES) {
      if (Array.isArray(stored[zone])) next[zone] = stored[zone];
    }
    // Fold the legacy `card` placements into the pill-form `card-labels` zone (the `card` key is
    // dropped because `emptyCardFieldZones()` no longer includes it).
    next["card-labels"] = [...next["card-labels"], ...stored.card];

    await db
      .update(cardDisplayRules)
      .set({
        fieldZones: next as CardFieldZones,
      })
      .where(eq(cardDisplayRules.id, row.id));
  }
}

/**
 * One-time boot backfill: place the card header fields (`title`, `externalLink`, `more`) into rules
 * whose stored `field_zones` predate them. Title is prepended to `card-single-top` (the heading row)
 * and `externalLink` + `more` appended after it, reproducing the old fixed header. Idempotent — a key
 * already present in any zone is skipped, and inheriting rules (`field_zones IS NULL`) are left
 * untouched. Must run after `ensureDefaultCardDisplayRule`/`backfillCardDisplayRuleFieldZones`.
 */
export async function backfillCardDisplayRuleHeaderFields(): Promise<void> {
  const rows = await db.select().from(cardDisplayRules);
  for (const row of rows) {
    const stored = row.fieldZones as Record<string, CardFieldPlacement[]> | null;
    if (!stored) continue;

    const placed = new Set(
      CARD_FIELD_ZONES.flatMap(zone => (stored[zone] ?? []).map(p => p.key)),
    );
    const missing = HEADER_CARD_FIELD_KEYS.filter(key => !placed.has(key));
    if (missing.length === 0) continue;

    const next = emptyCardFieldZones();
    for (const zone of CARD_FIELD_ZONES) {
      if (Array.isArray(stored[zone])) next[zone] = [...stored[zone]];
    }
    // Title leads the heading row; the action buttons follow it.
    if (missing.includes("title")) next["card-single-top"].unshift({
      key: "title",
    });
    for (const key of missing.filter(k => k !== "title")) {
      next["card-single-top"].push({
        key,
      });
    }

    await db
      .update(cardDisplayRules)
      .set({
        fieldZones: next,
      })
      .where(eq(cardDisplayRules.id, row.id));
  }
}

/**
 * One-time boot backfill: place the `locations` field into rules whose stored `field_zones` predate
 * it. It's appended to its default body zone ({@link defaultBodyZone} → `card-labels`, the pill form),
 * reproducing the seed placement. Idempotent — a rule already carrying `locations` in any zone is
 * skipped, and inheriting rules (`field_zones IS NULL`) are left untouched. Must run after
 * `ensureDefaultCardDisplayRule`/`backfillCardDisplayRuleFieldZones`.
 */
export async function backfillCardDisplayRuleLocationsField(): Promise<void> {
  const rows = await db.select().from(cardDisplayRules);
  for (const row of rows) {
    const stored = row.fieldZones as Record<string, CardFieldPlacement[]> | null;
    if (!stored) continue;

    const placed = new Set(
      CARD_FIELD_ZONES.flatMap(zone => (stored[zone] ?? []).map(p => p.key)),
    );
    if (placed.has("locations")) continue;

    const next = emptyCardFieldZones();
    for (const zone of CARD_FIELD_ZONES) {
      if (Array.isArray(stored[zone])) next[zone] = [...stored[zone]];
    }
    next[defaultBodyZone("locations")].push({
      key: "locations",
    });

    await db
      .update(cardDisplayRules)
      .set({
        fieldZones: next,
      })
      .where(eq(cardDisplayRules.id, row.id));
  }
}

/**
 * One-time boot backfill: place the `podcastLink` field into rules whose stored `field_zones` predate
 * it. Appended to its default body zone ({@link defaultBodyZone} → `card-labels`, the pill form),
 * reproducing the seed placement. Idempotent — a rule already carrying `podcastLink` in any zone is
 * skipped, and inheriting rules (`field_zones IS NULL`) are left untouched. Must run after
 * `ensureDefaultCardDisplayRule`/`backfillCardDisplayRuleFieldZones`.
 */
export async function backfillCardDisplayRulePodcastLinkField(): Promise<void> {
  const rows = await db.select().from(cardDisplayRules);
  for (const row of rows) {
    const stored = row.fieldZones as Record<string, CardFieldPlacement[]> | null;
    if (!stored) continue;

    const placed = new Set(
      CARD_FIELD_ZONES.flatMap(zone => (stored[zone] ?? []).map(p => p.key)),
    );
    if (placed.has("podcastLink")) continue;

    const next = emptyCardFieldZones();
    for (const zone of CARD_FIELD_ZONES) {
      if (Array.isArray(stored[zone])) next[zone] = [...stored[zone]];
    }
    next[defaultBodyZone("podcastLink")].push({
      key: "podcastLink",
    });

    await db
      .update(cardDisplayRules)
      .set({
        fieldZones: next,
      })
      .where(eq(cardDisplayRules.id, row.id));
  }
}

/**
 * Shared body for the single-field "place this key into its default zone for every rule that
 * predates it" backfill (mirrors {@link backfillCardDisplayRuleLocationsField}'s logic, generalized
 * by key). Idempotent — a rule already carrying `key` in any zone is skipped; inheriting rules
 * (`field_zones IS NULL`) are left untouched.
 */
async function backfillCardDisplayRuleField(key: string): Promise<void> {
  const rows = await db.select().from(cardDisplayRules);
  for (const row of rows) {
    const stored = row.fieldZones as Record<string, CardFieldPlacement[]> | null;
    if (!stored) continue;

    const placed = new Set(
      CARD_FIELD_ZONES.flatMap(zone => (stored[zone] ?? []).map(p => p.key)),
    );
    if (placed.has(key)) continue;

    const next = emptyCardFieldZones();
    for (const zone of CARD_FIELD_ZONES) {
      if (Array.isArray(stored[zone])) next[zone] = [...stored[zone]];
    }
    next[defaultBodyZone(key)].push({
      key,
    });

    await db
      .update(cardDisplayRules)
      .set({
        fieldZones: next,
      })
      .where(eq(cardDisplayRules.id, row.id));
  }
}

/** One-time boot backfill: place the `people` field into rules whose stored `field_zones` predate it. */
export async function backfillCardDisplayRulePeopleField(): Promise<void> {
  await backfillCardDisplayRuleField("people");
}

/** One-time boot backfill: place the `groups` field into rules whose stored `field_zones` predate it. */
export async function backfillCardDisplayRuleGroupsField(): Promise<void> {
  await backfillCardDisplayRuleField("groups");
}

/** One-time boot backfill: place the `language` field into rules whose stored `field_zones` predate it. */
export async function backfillCardDisplayRuleLanguageField(): Promise<void> {
  await backfillCardDisplayRuleField("language");
}

/**
 * One-time boot backfill: place the `romanizedName` field into rules whose stored `field_zones`
 * predate it (it used to render baked into the `title` field). It's appended to its default body
 * zone ({@link defaultBodyZone} → `card-single-top`), so it keeps showing below the title header row.
 * Also rewrites any stray legacy `romanizedTitle` placement key to `romanizedName` — only possible on
 * a dev database that ran an earlier revision of this branch before the field was renamed; a no-op in
 * production, where the placeable romanized field never shipped. Idempotent — a rule already carrying
 * `romanizedName` (and no `romanizedTitle`) is skipped, and inheriting rules (`field_zones IS NULL`)
 * are left untouched. Must run after `ensureDefaultCardDisplayRule`/`backfillCardDisplayRuleFieldZones`.
 */
export async function backfillCardDisplayRuleRomanizedNameField(): Promise<void> {
  const rows = await db.select().from(cardDisplayRules);
  for (const row of rows) {
    const stored = row.fieldZones as Record<string, CardFieldPlacement[]> | null;
    if (!stored) continue;

    // Copy every zone, rewriting a legacy `romanizedTitle` placement key to `romanizedName`.
    let changed = false;
    const next = emptyCardFieldZones();
    for (const zone of CARD_FIELD_ZONES) {
      if (!Array.isArray(stored[zone])) continue;
      next[zone] = stored[zone].map((placement) => {
        if (placement.key !== "romanizedTitle") return placement;
        changed = true;
        return {
          ...placement,
          key: "romanizedName",
        };
      });
    }

    const placed = new Set(
      CARD_FIELD_ZONES.flatMap(zone => next[zone].map(p => p.key)),
    );
    if (!placed.has("romanizedName")) {
      next[defaultBodyZone("romanizedName")].push({
        key: "romanizedName",
      });
      changed = true;
    }

    if (!changed) continue;
    await db
      .update(cardDisplayRules)
      .set({
        fieldZones: next,
      })
      .where(eq(cardDisplayRules.id, row.id));
  }
}

/**
 * One-time boot backfill: migrate rules whose stored `card_zone_layouts` still use the legacy bare
 * string form (`"flex"`/`"grid"`) into the `{ mode, gap?, align? }` object shape. Idempotent — rules
 * that are already fully object-shaped (or inherit via `card_zone_layouts IS NULL`) are left untouched.
 */
export async function backfillCardDisplayRuleZoneLayouts(): Promise<void> {
  const rows = await db.select().from(cardDisplayRules);
  for (const row of rows) {
    const stored = row.cardZoneLayouts as Record<string, CardZoneLayout | "flex" | "grid"> | null;
    if (!stored) continue;
    // Nothing to migrate when every value is already an object.
    if (CARD_BODY_ZONES.every(zone => typeof stored[zone] !== "string")) continue;

    const next = {} as CardZoneLayouts;
    for (const zone of CARD_BODY_ZONES) {
      next[zone] = normalizeCardZoneLayout(stored[zone], zone === "card-table" ? "grid" : "flex");
    }

    await db
      .update(cardDisplayRules)
      .set({
        cardZoneLayouts: next,
      })
      .where(eq(cardDisplayRules.id, row.id));
  }
}

/**
 * Backfill `slug` for card display rules that predate the column (including the Default rule). Runs at
 * boot; idempotent — only rows whose `slug IS NULL` are assigned a unique slug derived from the name.
 */
export async function backfillCardDisplayRuleSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: cardDisplayRules.id,
      name: cardDisplayRules.name,
    })
    .from(cardDisplayRules)
    .where(isNull(cardDisplayRules.slug));
  if (missing.length === 0) return;

  const taken = new Set(await takenSlugs());
  for (const rule of missing) {
    const slug = uniqueSlug(rule.name, taken);
    taken.add(slug);
    await db.update(cardDisplayRules).set({
      slug,
    }).where(eq(cardDisplayRules.id, rule.id));
  }
}
