import { eq, sql } from "drizzle-orm";
import type {
  BookmarkImageMode,
  BookmarkImageVisibility,
  CardDisplayConfig,
  CardFieldZones,
  HomepageSectionImageLayout,
} from "@eesimple/types";
import {
  cardDisplayConfigFromFieldZones,
  defaultCardZoneLayouts,
  emptyCardFieldZones,
  emptyConditionTree,
} from "@eesimple/types";
import { db } from "@/db";
import { cardDisplayRules } from "@/db/schema";
import { defaultFieldZones } from "@/services/cardDisplayDefaults";
import { uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type RuleRow = typeof cardDisplayRules.$inferSelect;

/** Slugs already in use on the rules table (only the seeded Default row remains). */
const takenSlugs = () => takenSlugsOf(cardDisplayRules, cardDisplayRules.slug, cardDisplayRules.id);

/** The image presentation attributes of the config, resolved from a row with their concrete fallbacks. */
function toImageAttrs(row: RuleRow): Pick<
  CardDisplayConfig,
  "imageMode" | "imageVisibility" | "imageLayout" | "hideWebsiteForYouTube"
> {
  return {
    imageMode: (row.imageMode as BookmarkImageMode | null) ?? "natural",
    imageVisibility: (row.imageVisibility as BookmarkImageVisibility | null) ?? "shown",
    imageLayout: (row.imageLayout as HomepageSectionImageLayout | null) ?? "above",
    hideWebsiteForYouTube: row.hideWebsiteForYouTube ?? false,
  };
}

/**
 * Resolve the Default row into the single {@link CardDisplayConfig}: the dynamic body `sections`
 * (from the `sections` column, or derived from `field_zones` for a not-yet-backfilled row), the four
 * image corners (always the `image-*` keys of `field_zones`), and the image attributes.
 */
function toConfig(row: RuleRow): CardDisplayConfig {
  const image = toImageAttrs(row);
  const fieldZones = row.fieldZones ?? defaultFieldZones();
  const derived = cardDisplayConfigFromFieldZones(fieldZones, row.cardZoneLayouts, image);
  return {
    sections: row.sections ?? derived.sections,
    imageCorners: derived.imageCorners,
    ...image,
  };
}

/** Read the seeded Default row (the only row after teardown). */
async function loadDefaultRow(): Promise<RuleRow | undefined> {
  const [row] = await db
    .select()
    .from(cardDisplayRules)
    .where(eq(cardDisplayRules.isDefault, true))
    .limit(1);
  return row;
}

/** The single card-display configuration governing every listing card. */
export async function getCardDisplayConfig(): Promise<CardDisplayConfig> {
  const row = await loadDefaultRow();
  if (!row) {
    // Should not happen (the boot seed guarantees the row), but keep a concrete fallback.
    return cardDisplayConfigFromFieldZones(defaultFieldZones(), defaultCardZoneLayouts(), {
      imageMode: "natural",
      imageVisibility: "shown",
      imageLayout: "above",
      hideWebsiteForYouTube: false,
    });
  }
  return toConfig(row);
}

/** Merge the config's four image corners into a `field_zones` object, preserving the body zones. */
function cornersIntoFieldZones(
  base: CardFieldZones | null,
  corners: CardDisplayConfig["imageCorners"],
): CardFieldZones {
  const zones = base
    ? {
      ...base,
    }
    : emptyCardFieldZones();
  zones["image-top-left"] = corners["top-left"];
  zones["image-top-right"] = corners["top-right"];
  zones["image-bottom-left"] = corners["bottom-left"];
  zones["image-bottom-right"] = corners["bottom-right"];
  return zones;
}

/** Partially update the single card-display config (the Default row). Returns the resolved config. */
export async function updateCardDisplayConfig(
  patch: Partial<CardDisplayConfig>,
): Promise<CardDisplayConfig> {
  const row = await loadDefaultRow();
  if (!row) return getCardDisplayConfig();

  const updates: Partial<typeof cardDisplayRules.$inferInsert> = {};
  if (patch.sections !== undefined) updates.sections = patch.sections;
  if (patch.imageCorners !== undefined) {
    updates.fieldZones = cornersIntoFieldZones(row.fieldZones, patch.imageCorners);
  }
  if (patch.imageMode !== undefined) updates.imageMode = patch.imageMode;
  if (patch.imageVisibility !== undefined) updates.imageVisibility = patch.imageVisibility;
  if (patch.imageLayout !== undefined) updates.imageLayout = patch.imageLayout;
  if (patch.hideWebsiteForYouTube !== undefined) updates.hideWebsiteForYouTube = patch.hideWebsiteForYouTube;

  if (Object.keys(updates).length === 0) return toConfig(row);

  const [updated] = await db
    .update(cardDisplayRules)
    .set(updates)
    .where(eq(cardDisplayRules.id, row.id))
    .returning();
  return toConfig(updated ?? row);
}

/**
 * Seed the singleton Default card display row on boot. Idempotent — inserts the baseline row only
 * when no default row exists, with concrete `field_zones`/`sections` (the baseline every card uses)
 * and empty `conditions`.
 */
export async function ensureCardDisplayConfig(): Promise<void> {
  const [{
    count,
  }] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(cardDisplayRules)
    .where(eq(cardDisplayRules.isDefault, true));
  if (Number(count) > 0) return;

  const fieldZones = defaultFieldZones();
  const sections = cardDisplayConfigFromFieldZones(fieldZones, defaultCardZoneLayouts(), {
    imageMode: "natural",
    imageVisibility: "shown",
    imageLayout: "above",
    hideWebsiteForYouTube: false,
  }).sections;

  await db.insert(cardDisplayRules).values({
    name: "Default",
    slug: uniqueSlug("Default", await takenSlugs(), "card-display-rule"),
    description: null,
    conditions: emptyConditionTree(),
    sortOrder: 1_000_000,
    isDefault: true,
    fieldZones,
    cardZoneLayouts: defaultCardZoneLayouts(),
    sections,
    imageMode: "natural",
    imageVisibility: "shown",
    imageLayout: "above",
    hideWebsiteForYouTube: false,
  });
}

/**
 * Backfill the dynamic `sections` on the Default row for an existing deploy: if `sections` is null
 * but `field_zones` holds body placements, derive `sections` from `field_zones` + `card_zone_layouts`
 * so the operator's current Default card layout is preserved across the upgrade. Idempotent.
 */
export async function backfillCardDisplaySections(): Promise<void> {
  const row = await loadDefaultRow();
  if (!row || row.sections != null) return;
  const fieldZones = row.fieldZones ?? defaultFieldZones();
  const sections = cardDisplayConfigFromFieldZones(fieldZones, row.cardZoneLayouts, toImageAttrs(row)).sections;
  await db
    .update(cardDisplayRules)
    .set({
      sections,
    })
    .where(eq(cardDisplayRules.id, row.id));
}

/**
 * Ensure the "Match Type" card field is placed on the Default config for an existing deploy — new
 * installs already get it via the seed (`defaultFieldZones()` includes the key). "Absent = hidden",
 * so without this an upgraded deploy would never show the field, even though it only renders while a
 * search is active. Appends it to the last body section if no section already carries it. Idempotent;
 * prune once it has run in production (per the `card-field-area` skill's spent-backfill note).
 */
export async function backfillMatchTypeCardField(): Promise<void> {
  const row = await loadDefaultRow();
  if (!row) return;
  const sections = row.sections
    ?? cardDisplayConfigFromFieldZones(
      row.fieldZones ?? defaultFieldZones(),
      row.cardZoneLayouts,
      toImageAttrs(row),
    ).sections;
  if (sections.length === 0 || sections.some(section => section.fields.some(field => field.key === "matchType"))) {
    return;
  }
  const lastIndex = sections.length - 1;
  const next = sections.map((section, index) =>
    index === lastIndex
      ? {
        ...section,
        fields: [...section.fields, {
          key: "matchType",
        }],
      }
      : section);
  await db
    .update(cardDisplayRules)
    .set({
      sections: next,
    })
    .where(eq(cardDisplayRules.id, row.id));
}

/**
 * Remove any non-default card display rules left from the retired multi-rule model. The single-config
 * resolver only ever reads the Default row, so leftover rows are inert; this just tidies them. Idempotent.
 */
export async function deleteNonDefaultCardDisplayRules(): Promise<void> {
  await db.delete(cardDisplayRules).where(eq(cardDisplayRules.isDefault, false));
}
