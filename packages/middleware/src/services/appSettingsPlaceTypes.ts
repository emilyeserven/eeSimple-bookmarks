import { eq } from "drizzle-orm";
import type {
  PlaceTypeColorConfig,
  PlaceTypeDisplayConfig,
  PlaceTypeIconConfig,
  PlaceTypeLevelGroup,
  PlaceTypeLevelGroupConfig,
} from "@eesimple/types";
import { CANONICAL_PLACE_TYPE_ORDER, LOCATION_DISPLAY_MODES, normalizeHexColor, normalizeIconName, normalizeLevelMode, placeTypeKey } from "@eesimple/types";
import { db } from "@/db";
import { appSettings, locations } from "@/db/schema";
import { DEFAULT_SHORTENER_IGNORE_LIST, ROW_ID } from "./appSettingsShared";

/**
 * Sanitize a per-placeType display config: keep only well-formed entries (valid `displayMode`,
 * boolean `visible`, finite `sortOrder`) under a normalized placeType key. Tolerates arbitrary
 * client/stored shapes so a malformed jsonb row never crashes the map.
 */
export function normalizePlaceTypeDisplay(input: unknown): PlaceTypeDisplayConfig {
  if (input === null || typeof input !== "object") return {};
  const out: PlaceTypeDisplayConfig = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = placeTypeKey(rawKey);
    if (key === "" || rawValue === null || typeof rawValue !== "object") continue;
    const value = rawValue as Record<string, unknown>;
    const displayMode = LOCATION_DISPLAY_MODES.find(mode => mode === value.displayMode);
    if (!displayMode) continue;
    const color = normalizeHexColor(value.color);
    out[key] = {
      displayMode,
      visible: value.visible !== false,
      sortOrder: typeof value.sortOrder === "number" && Number.isFinite(value.sortOrder)
        ? value.sortOrder
        : 0,
      ...(color
        ? {
          color,
        }
        : {}),
    };
  }
  return out;
}

/** Read the per-placeType map display config (Settings → Locations + the map "Levels" overlay). */
export async function getPlaceTypeDisplay(): Promise<PlaceTypeDisplayConfig> {
  const [row] = await db
    .select({
      placeTypeDisplay: appSettings.placeTypeDisplay,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return normalizePlaceTypeDisplay(row?.placeTypeDisplay ?? {});
}

/** Replace the per-placeType map display config, upserting the singleton. Returns the stored value. */
export async function updatePlaceTypeDisplay(
  input: PlaceTypeDisplayConfig,
): Promise<PlaceTypeDisplayConfig> {
  const next = normalizePlaceTypeDisplay(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      placeTypeDisplay: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        placeTypeDisplay: next,
      },
    });
  return next;
}

/**
 * Sanitize the named place-type level groups: keep only well-formed groups (a string id+name, a
 * valid `displayMode`, an array of normalized member place-type keys), coercing `visible`/`sortOrder`.
 * Tolerates arbitrary client/stored shapes so a malformed jsonb row never crashes the map.
 */
export function normalizePlaceTypeLevelGroups(input: unknown): PlaceTypeLevelGroupConfig {
  if (!Array.isArray(input)) return [];
  const out: PlaceTypeLevelGroupConfig = [];
  input.forEach((rawGroup, index) => {
    if (rawGroup === null || typeof rawGroup !== "object") return;
    const value = rawGroup as Record<string, unknown>;
    const displayMode = LOCATION_DISPLAY_MODES.find(mode => mode === value.displayMode);
    if (!displayMode) return;
    const id = typeof value.id === "string" && value.id.trim() !== ""
      ? value.id
      : `group-${index}`;
    const name = typeof value.name === "string" ? value.name.trim() : "";
    const placeTypes = Array.isArray(value.placeTypes)
      ? [...new Set(
        value.placeTypes
          .filter((pt): pt is string => typeof pt === "string")
          .map(pt => placeTypeKey(pt))
          .filter(pt => pt !== ""),
      )]
      : [];
    // `visible` is retired as a user setting (superseded by the per-anchor `defaultHiddenGroupIds`
    // checklist) — it is always stored `true`. The legacy value survives only to seed the
    // `showOnMainMap` back-compat default for pre-`showOnMainMap` configs.
    const legacyVisible = value.visible !== false;
    const defaultHiddenGroupIds = Array.isArray(value.defaultHiddenGroupIds)
      ? [...new Set(
        value.defaultHiddenGroupIds.filter((gid): gid is string => typeof gid === "string" && gid.trim() !== ""),
      )]
      : [];
    const group: PlaceTypeLevelGroup = {
      id,
      name,
      placeTypes,
      displayMode,
      visible: true,
      // Absent → fall back to the legacy `visible` so existing configs keep the current main-map
      // appearance (before `showOnMainMap` existed, every visible group showed on the main map).
      showOnMainMap: typeof value.showOnMainMap === "boolean" ? value.showOnMainMap : legacyVisible,
      levelMode: normalizeLevelMode(value.levelMode),
      defaultHiddenGroupIds,
      sortOrder: typeof value.sortOrder === "number" && Number.isFinite(value.sortOrder)
        ? value.sortOrder
        : index,
      color: normalizeHexColor(value.color),
    };
    out.push(group);
  });
  return out;
}

/** Read the named place-type level groups (Settings → Locations + the map "Levels" overlay). */
export async function getPlaceTypeLevelGroups(): Promise<PlaceTypeLevelGroupConfig> {
  const [row] = await db
    .select({
      placeTypeLevelGroups: appSettings.placeTypeLevelGroups,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return normalizePlaceTypeLevelGroups(row?.placeTypeLevelGroups ?? []);
}

/** Replace the named place-type level groups, upserting the singleton. Returns the stored value. */
export async function updatePlaceTypeLevelGroups(
  input: PlaceTypeLevelGroupConfig,
): Promise<PlaceTypeLevelGroupConfig> {
  const next = normalizePlaceTypeLevelGroups(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      placeTypeLevelGroups: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        placeTypeLevelGroups: next,
      },
    });
  return next;
}

/**
 * Sanitize the per-placeType map-pin icon overrides: keep only entries whose key normalizes to a
 * non-empty place-type key and whose value is a usable Lucide icon name. Tolerates arbitrary
 * client/stored shapes so a malformed jsonb row never crashes the map.
 */
export function normalizePlaceTypeIcons(input: unknown): PlaceTypeIconConfig {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return {};
  const out: PlaceTypeIconConfig = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = placeTypeKey(rawKey);
    const icon = normalizeIconName(rawValue);
    if (key !== "" && icon) out[key] = icon;
  }
  return out;
}

/** Read the per-placeType map-pin icon overrides (Settings → Locations "Place Type Icons"). */
export async function getPlaceTypeIcons(): Promise<PlaceTypeIconConfig> {
  const [row] = await db
    .select({
      placeTypeIcons: appSettings.placeTypeIcons,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return normalizePlaceTypeIcons(row?.placeTypeIcons ?? {});
}

/** Replace the per-placeType map-pin icon overrides, upserting the singleton. Returns the stored value. */
export async function updatePlaceTypeIcons(
  input: PlaceTypeIconConfig,
): Promise<PlaceTypeIconConfig> {
  const next = normalizePlaceTypeIcons(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      placeTypeIcons: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        placeTypeIcons: next,
      },
    });
  return next;
}

/**
 * Sanitize the per-placeType map color overrides: keep only entries whose key normalizes to a
 * non-empty place-type key and whose value is a valid `#rgb`/`#rrggbb` hex color. Tolerates arbitrary
 * client/stored shapes so a malformed jsonb row never crashes the map.
 */
export function normalizePlaceTypeColors(input: unknown): PlaceTypeColorConfig {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return {};
  const out: PlaceTypeColorConfig = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = placeTypeKey(rawKey);
    const color = normalizeHexColor(rawValue);
    if (key !== "" && color) out[key] = color;
  }
  return out;
}

/** Read the per-placeType map color overrides (Settings → Locations "Pin Style"). */
export async function getPlaceTypeColors(): Promise<PlaceTypeColorConfig> {
  const [row] = await db
    .select({
      placeTypeColors: appSettings.placeTypeColors,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return normalizePlaceTypeColors(row?.placeTypeColors ?? {});
}

/** Replace the per-placeType map color overrides, upserting the singleton. Returns the stored value. */
export async function updatePlaceTypeColors(
  input: PlaceTypeColorConfig,
): Promise<PlaceTypeColorConfig> {
  const next = normalizePlaceTypeColors(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      placeTypeColors: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        placeTypeColors: next,
      },
    });
  return next;
}

/**
 * Move a slug-keyed `Record` entry from `from` onto `to`, **only where `to` has no entry**, always
 * dropping `from`. Returns the new record, or `null` when `from` is absent (nothing to migrate). Pure —
 * shared by the display, icon, and color migrations and unit-tested directly.
 */
export function remapRecordKey<V>(
  record: Record<string, V>,
  from: string,
  to: string,
): Record<string, V> | null {
  if (!(from in record)) return null;
  const next = {
    ...record,
  };
  if (!(to in next)) next[to] = next[from];
  delete next[from];
  return next;
}

/**
 * Rewrite level-group membership, replacing place-type key `from` with `to` (deduped), dropping `from`.
 * Returns the new groups, or `null` when no group references `from`. Pure — unit-tested directly.
 */
export function remapLevelGroupMembers(
  groups: PlaceTypeLevelGroupConfig,
  from: string,
  to: string,
): PlaceTypeLevelGroupConfig | null {
  let touched = false;
  const next = groups.map((group) => {
    if (!group.placeTypes.includes(from)) return group;
    touched = true;
    const members = group.placeTypes.filter(pt => pt !== from);
    if (!members.includes(to)) members.push(to);
    return {
      ...group,
      placeTypes: members,
    };
  });
  return touched ? next : null;
}

/**
 * Migrate the slug-keyed map display config from a deleted place type onto a reassign target — moving
 * its `placeTypeDisplay` setting, `placeTypeIcons` glyph, and `placeTypeColors` color onto the target
 * **only where the target has none**, rewriting its `placeTypeLevelGroups` membership to the target,
 * and always dropping the old slug. Used by `deletePlaceType` when locations are reassigned, so the
 * carried-over look follows the relocated locations. No-op when `oldSlug === targetSlug` or either is
 * blank.
 */
export async function migratePlaceTypeConfig(oldSlug: string, targetSlug: string): Promise<void> {
  const from = placeTypeKey(oldSlug);
  const to = placeTypeKey(targetSlug);
  if (from === "" || to === "" || from === to) return;

  const nextDisplay = remapRecordKey(await getPlaceTypeDisplay(), from, to);
  if (nextDisplay) await updatePlaceTypeDisplay(nextDisplay);

  const nextIcons = remapRecordKey(await getPlaceTypeIcons(), from, to);
  if (nextIcons) await updatePlaceTypeIcons(nextIcons);

  const nextColors = remapRecordKey(await getPlaceTypeColors(), from, to);
  if (nextColors) await updatePlaceTypeColors(nextColors);

  const nextGroups = remapLevelGroupMembers(await getPlaceTypeLevelGroups(), from, to);
  if (nextGroups) await updatePlaceTypeLevelGroups(nextGroups);
}

/** Starter level-group buckets, covering {@link CANONICAL_PLACE_TYPE_ORDER} most-general → specific. */
const SEED_LEVEL_GROUP_BUCKETS: { id: string;
  name: string;
  placeTypes: string[]; }[] = [
  {
    id: "seed-country",
    name: "Country",
    placeTypes: ["continent", "country"],
  },
  {
    id: "seed-region",
    name: "Region",
    placeTypes: ["state", "region", "province", "state_district", "county"],
  },
  {
    id: "seed-locality",
    name: "Locality",
    placeTypes: ["municipality", "city", "borough", "town", "village", "hamlet"],
  },
  {
    id: "seed-neighborhood",
    name: "Neighborhood",
    placeTypes: ["suburb", "quarter", "neighbourhood", "city_block"],
  },
  {
    id: "seed-area",
    name: "Area",
    placeTypes: ["island", "islet", "locality"],
  },
];

/** Canonical rank for ordering a place type (unknowns sort last), used when seeding "Other". */
function canonicalRank(key: string): number {
  const index = CANONICAL_PLACE_TYPE_ORDER.indexOf(key as (typeof CANONICAL_PLACE_TYPE_ORDER)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Seed an initial set of named place-type level groups the first time (when the column is null) by
 * bucketing the place types discovered in the data (∪ any legacy per-placeType config) into a few
 * tiers (Country / Region / Locality / Neighborhood / Area), plus an "Other" group for anything
 * unrecognized. Carries over each member's legacy `visible`/`displayMode` where one was set. Idempotent
 * — skips once the column holds an array (even an empty one the user cleared), and writes nothing
 * until at least one place type exists, so it self-heals on a later boot.
 */
export async function ensureDefaultPlaceTypeLevelGroups(): Promise<void> {
  const [row] = await db
    .select({
      groups: appSettings.placeTypeLevelGroups,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  // Only seed when never initialized (null); an explicit array (incl. []) means the user owns it.
  if (row && row.groups != null) return;

  const legacy = await getPlaceTypeDisplay();
  const distinctRows = await db
    .selectDistinct({
      placeType: locations.placeType,
    })
    .from(locations);
  const allKeys = new Set<string>(Object.keys(legacy));
  for (const r of distinctRows) {
    const key = placeTypeKey(r.placeType);
    if (key !== "") allKeys.add(key);
  }
  if (allKeys.size === 0) return; // no place types yet — try again on a later boot

  const assigned = new Set<string>();
  const groups: PlaceTypeLevelGroupConfig = [];
  let sortOrder = 0;
  for (const bucket of SEED_LEVEL_GROUP_BUCKETS) {
    const members = bucket.placeTypes.filter(pt => allKeys.has(pt));
    if (members.length === 0) continue;
    members.forEach(pt => assigned.add(pt));
    const configured = members.map(pt => legacy[pt]).filter(Boolean) as PlaceTypeDisplayConfig[string][];
    groups.push({
      id: bucket.id,
      name: bucket.name,
      placeTypes: members,
      displayMode: configured[0]?.displayMode ?? "area",
      visible: configured.length > 0 ? configured.some(setting => setting.visible) : true,
      sortOrder: sortOrder++,
    });
  }
  const others = [...allKeys]
    .filter(key => !assigned.has(key))
    .sort((a, b) => canonicalRank(a) - canonicalRank(b) || a.localeCompare(b));
  if (others.length > 0) {
    const configured = others.map(pt => legacy[pt]).filter(Boolean) as PlaceTypeDisplayConfig[string][];
    groups.push({
      id: "seed-other",
      name: "Other",
      placeTypes: others,
      displayMode: configured[0]?.displayMode ?? "area",
      visible: configured.length > 0 ? configured.some(setting => setting.visible) : true,
      sortOrder: sortOrder++,
    });
  }
  await updatePlaceTypeLevelGroups(groups);
}
