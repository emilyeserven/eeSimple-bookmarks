/**
 * Shared "Locations" taxonomy types. A Location is a hierarchical place (city → region → country)
 * a bookmark can be tagged with. Locations carry a title + romanized title + free-form alternate
 * names (different romanization styles), an optional geographic coordinate, a map link, and a
 * Google "Plus Code" (Open Location Code).
 *
 * This module is pure (it only imports the pure title matcher) so it runs unchanged in the Fastify
 * API and the browser, mirroring `./titleTags.ts`.
 */

import { titleMatchesTerm } from "./titleTags.js";

/**
 * A simplified GeoJSON boundary geometry for a location (an administrative area outline fetched from
 * OpenStreetMap Nominatim). Only area geometries are kept — a point-only place leaves `boundary`
 * null and renders as a pin. Stored verbatim and handed to Leaflet's GeoJSON layer for rendering.
 */
export interface LocationBoundary {
  type: "Polygon" | "MultiPolygon";
  /** GeoJSON ring coordinates — `number[][][]` for Polygon, `number[][][][]` for MultiPolygon. */
  coordinates: number[][][] | number[][][][];
}

/** An alternate name for a location, optionally labeled with the romanization style it belongs to. */
export interface LocationAlternateName {
  /** The alternate spelling/name (e.g. a Hepburn vs Kunrei romanization). */
  value: string;
  /** Optional label for the romanization/naming style (e.g. `"Hepburn"`, `"Pinyin"`). */
  style?: string | null;
}

/** A node in the hierarchical Locations taxonomy. `parentId === null` marks a root location. */
export interface Location {
  id: string;
  /** Primary display title, unique among its siblings. */
  name: string;
  /** Optional romanized form of the title, shown de-emphasized after the name when present. */
  romanizedName?: string | null;
  /** URL-friendly identifier derived from the name; unique across all locations. */
  slug: string;
  /** Extra names for different romanization styles; matched alongside `name`/`romanizedName`. */
  alternateNames: LocationAlternateName[];
  /** Latitude in decimal degrees (−90…90), or `null` when no coordinate is set. */
  latitude: number | null;
  /** Longitude in decimal degrees (−180…180), or `null` when no coordinate is set. */
  longitude: number | null;
  /** A map link (e.g. a Google Maps URL), or `null`. */
  mapUrl: string | null;
  /** A Google "Plus Code" / Open Location Code, or `null`. */
  plusCode: string | null;
  /** Loose place classification (e.g. `"city"`, `"region"`, `"country"`), or `null`. */
  placeType: string | null;
  /** ISO 3166-1 alpha-2 country code, or `null`. */
  countryCode: string | null;
  /** GeoJSON area outline for the place (rendered as a map polygon), or `null` for a point-only place. */
  boundary?: LocationBoundary | null;
  /**
   * The Wikidata item id (QID, e.g. `"Q1001724"`) this location was resolved from, or `null`. Set
   * when a Wikidata search result was picked in the location lookup — including informal/traditional
   * regions with no Nominatim admin boundary (e.g. 中国地方, the Chūgoku region) that only Wikidata
   * carries. Kept so the location can be re-identified/re-fetched against Wikidata later.
   */
  wikidataId: string | null;
  /**
   * Whether this location's latitude/longitude came from Wikidata rather than Nominatim. Auto-set when
   * a Wikidata lookup result is applied to the form; the user can also toggle it by hand. When `true`,
   * coordinate/area refreshes (`refreshLocationCoordinates`, `ensureLocationBoundary`) query Wikidata
   * only — Nominatim is skipped, since this place's lat/long source of truth is Wikidata.
   */
  usesWikidataCoordinates: boolean;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Parent location id, or `null` for a root-level location. */
  parentId: string | null;
  /** ISO-8601 timestamp of when the location was created. */
  createdAt: string;
  /** Ids of the "looser" tags (mood / biome / …) associated with this location. */
  tagIds?: string[];
  /** Distinct bookmarks carrying this location or any of its descendants (populated by list endpoints). */
  bookmarkCount?: number;
  /** Distinct bookmarks carrying this location directly, excluding its descendants. */
  ownBookmarkCount?: number;
}

/** A location with its children populated — used to render the taxonomy tree. */
export interface LocationNode extends Location {
  children: LocationNode[];
}

/** Lightweight location shape carried on a bookmark. */
export type BookmarkLocation = Pick<Location, "id" | "name" | "slug" | "parentId">;

/** Payload for creating a location. */
export interface CreateLocationInput {
  name: string;
  romanizedName?: string | null;
  alternateNames?: LocationAlternateName[];
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
  plusCode?: string | null;
  placeType?: string | null;
  countryCode?: string | null;
  boundary?: LocationBoundary | null;
  /** The Wikidata QID this location was resolved from, or `null`/omitted. */
  wikidataId?: string | null;
  /** Whether the latitude/longitude came from Wikidata; gates Nominatim out of future refreshes. */
  usesWikidataCoordinates?: boolean;
  sortOrder?: number;
  /** Parent location id, or `null`/omitted for a root location. */
  parentId?: string | null;
  /** Ids of the looser (mood/biome) tags to associate. */
  tagIds?: string[];
}

/** Payload for partially updating a location (rename, reparent, edit coordinates, etc.). */
export interface UpdateLocationInput {
  name?: string;
  romanizedName?: string | null;
  alternateNames?: LocationAlternateName[];
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
  plusCode?: string | null;
  placeType?: string | null;
  countryCode?: string | null;
  boundary?: LocationBoundary | null;
  /** The Wikidata QID this location was resolved from, or `null`/omitted. */
  wikidataId?: string | null;
  /** Whether the latitude/longitude came from Wikidata; gates Nominatim out of future refreshes. */
  usesWikidataCoordinates?: boolean;
  sortOrder?: number;
  parentId?: string | null;
  tagIds?: string[];
}

/**
 * Payload for creating a location together with its higher-level ancestor chain in one call (e.g.
 * Hagi → Yamaguchi Prefecture → Chuugoku Region → Honshuu → Japan). `ancestors` is ordered from the
 * leaf's **immediate parent up to the root**; each entry is reused if a location with the same name
 * already exists under the resolved parent, otherwise it is created.
 */
export interface CreateLocationChainInput {
  /** The leaf location to create (e.g. the city). */
  location: CreateLocationInput;
  /** Ancestors from the immediate parent up to the root; omit/empty to just create `location`. */
  ancestors?: CreateLocationInput[];
  /**
   * Existing location id that the **top** of the chain attaches to — the parent of the topmost
   * `ancestors` entry, or of `location` itself when `ancestors` is empty. Lets a chain reuse an
   * existing ancestor (e.g. an already-saved "Japan") instead of recreating it. Omit/null for a
   * root chain.
   */
  parentId?: string | null;
}

/**
 * Payload for (re)building the ancestor chain **above an existing location**. Mirrors the chain
 * portion of {@link CreateLocationChainInput}, but targets a location that already exists: the
 * `ancestors` (immediate-parent-first) are created or reused by name, then the location is reparented
 * under the nearest resolved ancestor. An optional `parentId` anchors the **top** of the chain to an
 * existing location; omit/null to build from the root. An empty `ancestors` with `parentId` set is a
 * plain reparent; an empty `ancestors` with no `parentId` detaches the location to the root.
 */
export interface SetLocationAncestorsInput {
  /** Ancestors from the immediate parent up to the root; omit/empty to just reparent. */
  ancestors?: CreateLocationInput[];
  /** Existing location id the top of the chain attaches to, or `null`/omitted for a root chain. */
  parentId?: string | null;
}

/** A location reduced to the fields the title matcher needs. */
export interface LocationTitleCandidate {
  id: string;
  name: string;
  romanizedName?: string | null;
  alternateNames?: LocationAlternateName[];
}

/**
 * The ids of locations implied by a bookmark's title. Each location's `name`, `romanizedName`, and
 * every `alternateNames[].value` are tested against both the bookmark's `title` and its
 * `romanizedTitle` via {@link titleMatchesTerm}. Pure helper — mirrors `matchTagIdsByTitle`.
 */
export function matchLocationIdsByTitle(
  title: string,
  romanizedTitle: string | null | undefined,
  locations: LocationTitleCandidate[],
): string[] {
  const haystacks = [title, romanizedTitle ?? ""].filter(text => text.trim() !== "");
  if (haystacks.length === 0) return [];
  return locations
    .filter((loc) => {
      const terms = [
        loc.name,
        loc.romanizedName ?? "",
        ...(loc.alternateNames ?? []).map(alt => alt.value),
      ].filter(text => text.trim() !== "");
      return terms.some(term => haystacks.some(haystack => titleMatchesTerm(haystack, term)));
    })
    .map(loc => loc.id);
}

/**
 * One geocoded ancestor level above a candidate, ordered immediate-parent-first up to the country.
 * Carries only the name + a loose place classification + the country code — coordinates aren't
 * fetched per level (that would mean an extra geocoder call each), so they're left to be filled in
 * manually or by looking the ancestor up on its own.
 */
export interface LocationLookupAncestor {
  /** The ancestor place's name (e.g. `"山口県"`, `"日本"`). */
  name: string;
  /** Loose classification from the geocoder's address key (e.g. `"state"`, `"county"`, `"country"`). */
  placeType: string | null;
  /** ISO 3166-1 alpha-2 country code shared with the candidate, or `null`. */
  countryCode: string | null;
  /** The ancestor's Wikidata QID when resolved via the Wikidata fallback, else `null` (Nominatim). */
  wikidataId: string | null;
}

/** A single candidate returned by the geocoding lookup. */
export interface LocationLookupCandidate {
  /** Local/native-script name (e.g. `"萩市"`), preferred as the location's title. */
  name: string;
  /** Romanized / English form of the name (e.g. `"Hagi"`), or `null` when the name is already Latin. */
  romanizedName: string | null;
  /** Full human-readable address/label (e.g. `"萩市, 山口県, 日本"`). */
  displayName: string;
  latitude: number;
  longitude: number;
  /** Loose place classification reported by the geocoder, or `null`. */
  placeType: string | null;
  /** ISO 3166-1 alpha-2 country code, or `null`. */
  countryCode: string | null;
  /** A pre-built map link for the coordinate, or `null`. */
  mapUrl: string | null;
  /** GeoJSON area outline for the place, or `null` when only a point is available. */
  boundary: LocationBoundary | null;
  /** Higher-level places above this one, immediate-parent-first (empty when none could be parsed). */
  ancestors: LocationLookupAncestor[];
  /**
   * The Wikidata QID this candidate was resolved from when it came from the Wikidata fallback, else
   * `null` (Nominatim). Presence of a QID is what the location lookup box uses to auto-check "Uses
   * Wikidata for coordinates" when a result is picked.
   */
  wikidataId: string | null;
}

/** Response shape of `GET /api/locations/lookup`. */
export interface LocationLookupResult {
  results: LocationLookupCandidate[];
}

/**
 * The two ways a location can render on the map. Derived tuple = the single source for the client
 * zod/select enums and the middleware Fastify JSON-Schema enum (don't hand-mirror this list).
 */
export const LOCATION_DISPLAY_MODES = ["pin", "area"] as const;
export type LocationDisplayMode = typeof LOCATION_DISPLAY_MODES[number];

/**
 * Leaflet's built-in vector/marker color. Used as the map fallback when a level has no custom color,
 * and as the swatch the Settings color picker starts from.
 */
export const DEFAULT_LOCATION_MAP_COLOR = "#3388ff";

/**
 * Normalize a user/stored value into a `#rgb` / `#rrggbb` hex color (lowercased), or `null` when it
 * isn't a valid hex color. Keeps a malformed jsonb row or a stray client value from reaching Leaflet.
 */
export function normalizeHexColor(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(trimmed) ? trimmed : null;
}

/**
 * Normalize a user/stored value into a Lucide icon name (a trimmed, length-capped non-empty string),
 * or `null` when it isn't usable. We don't validate against the Lucide catalog here — that list lives
 * client-side and the renderer falls back to a default for unknown names — so this only guards against
 * a malformed jsonb row or a stray non-string value.
 */
export function normalizeIconName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  return trimmed !== "" && trimmed.length <= 64 ? trimmed : null;
}

/** A named, ready-made set of map colors the user can apply across their level groups in one click. */
export interface LocationMapPalette {
  /** Stable id. */
  id: string;
  /** User-facing label shown next to the swatches. */
  name: string;
  /** Ordered hex colors, assigned to the level groups in order (wrapping when there are more groups). */
  colors: string[];
}

/**
 * Predefined map-color palettes offered on Settings → Locations. Applying one assigns its colors to
 * the level groups in display order (wrapping if there are more groups than colors). The single source
 * of truth for the palette list — the Settings UI maps over this.
 */
export const LOCATION_MAP_PALETTES: LocationMapPalette[] = [
  {
    id: "vivid",
    name: "Vivid",
    colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"],
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: ["#0c4a6e", "#0369a1", "#0891b2", "#06b6d4", "#22d3ee", "#67e8f9"],
  },
  {
    id: "earth",
    name: "Earth",
    colors: ["#78350f", "#a16207", "#4d7c0f", "#15803d", "#0e7490", "#1e3a8a"],
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: ["#7c2d12", "#b91c1c", "#ea580c", "#f59e0b", "#fbbf24", "#fde68a"],
  },
  {
    id: "forest",
    name: "Forest",
    colors: ["#14532d", "#166534", "#15803d", "#4d7c0f", "#65a30d", "#84cc16"],
  },
  {
    id: "pastel",
    name: "Pastel",
    colors: ["#fca5a5", "#fdba74", "#fde68a", "#86efac", "#93c5fd", "#c4b5fd"],
  },
];

/** Per-placeType map display configuration (one entry per Nominatim place type / "level"). */
export interface PlaceTypeDisplaySetting {
  /** Intent: `area` renders the boundary when one exists (else a pin); `pin` always renders a pin. */
  displayMode: LocationDisplayMode;
  /** Whether locations of this place type are shown on the map at all. */
  visible: boolean;
  /** Ordering weight among place-type levels (lower sorts first); drives the placeType sort. */
  sortOrder: number;
  /** Optional `#rrggbb` color for this level's pins/areas; absent → Leaflet's default blue. */
  color?: string;
}

/**
 * Map of normalized placeType key → its display setting. **Sparse** — a place type with no entry
 * uses the defaults (visible `area`), so the config only needs rows the user has customized.
 */
export type PlaceTypeDisplayConfig = Record<string, PlaceTypeDisplaySetting>;

/**
 * Map of normalized placeType key → a Lucide icon name drawn inside that place type's map pin.
 * **Sparse** — a place type with no entry renders the default pin (no glyph). Configured per place
 * type (not per level group) so place types sharing a group can still show distinct icons. Stored
 * standalone on the app-settings singleton, separate from the group-derived {@link PlaceTypeDisplayConfig}.
 */
export type PlaceTypeIconConfig = Record<string, string>;

/**
 * Map of normalized placeType key → a `#rrggbb` color overriding that place type's map pin/area color.
 * **Sparse** — a place type with no entry inherits its level group's color (or Leaflet's default).
 * Configured per place type (not per level group) so place types sharing a group can still render in
 * distinct colors. Stored standalone on the app-settings singleton, separate from the group-derived
 * {@link PlaceTypeDisplayConfig}; resolved with override-wins precedence over the group color.
 */
export type PlaceTypeColorConfig = Record<string, string>;

/**
 * A named "level" — a user-defined group of Nominatim place types configured in Settings → Locations.
 * The group is the unit of display control: its member place types all inherit the group's
 * visibility, pin/area render mode, and order. This is the source of truth the Settings list and the
 * map's "Levels" overlay edit; the per-placeType {@link PlaceTypeDisplayConfig} the map/sort consume
 * is **derived** from it (see {@link expandLevelGroupsToDisplayConfig}).
 */
export interface PlaceTypeLevelGroup {
  /** Stable id (generated when the group is created). */
  id: string;
  /** User-facing label (e.g. `"Country"`, `"Region"`, `"City"`). */
  name: string;
  /** Normalized place-type keys assigned to this group. */
  placeTypes: string[];
  /** How locations in this group render: `area` (boundary when present, else pin) or `pin`. */
  displayMode: LocationDisplayMode;
  /** Whether locations in this group are shown on the map at all. */
  visible: boolean;
  /**
   * Whether this level is shown by default on the **main** all-locations map (`/taxonomies/locations`).
   * Only the main index map reads this; a place's own pages and bookmark maps resolve visibility from
   * the viewed place's level instead. Absent → treated as the group's `visible` (legacy default).
   */
  showOnMainMap?: boolean;
  /** Ordering weight among groups (lower sorts first). */
  sortOrder: number;
  /**
   * Optional `#rrggbb` color for this level's pins/areas on the map. `null`/absent → Leaflet's
   * default blue. Set per group in Settings → Locations or via a predefined palette.
   */
  color?: string | null;
}

/** The full ordered list of place-type level groups (stored on the app-settings singleton). */
export type PlaceTypeLevelGroupConfig = PlaceTypeLevelGroup[];

/**
 * Expand the named level groups into the per-placeType {@link PlaceTypeDisplayConfig} the map renderer
 * and the place-type tree sort consume. Each member place type inherits its group's `displayMode`,
 * `visible`, and `sortOrder` (so members of a group share the group's order). A place type belonging
 * to no group is simply absent from the result — {@link resolveLocationDisplay} then treats it as the
 * legacy default (visible `area`). When a place type appears in more than one group, the
 * lowest-`sortOrder` group wins. Pure helper — shared by the client and unit-tested directly.
 */
export function expandLevelGroupsToDisplayConfig(
  groups: PlaceTypeLevelGroupConfig,
): PlaceTypeDisplayConfig {
  const config: PlaceTypeDisplayConfig = {};
  const winningOrder: Record<string, number> = {};
  for (const group of groups) {
    for (const placeType of group.placeTypes) {
      const key = placeTypeKey(placeType);
      if (key === "") continue;
      if (key in config && winningOrder[key] <= group.sortOrder) continue;
      const color = normalizeHexColor(group.color);
      config[key] = {
        displayMode: group.displayMode,
        visible: group.visible,
        sortOrder: group.sortOrder,
        // Sparse: only carry a color when the group sets a valid one, so unstyled levels stay default.
        ...(color
          ? {
            color,
          }
          : {}),
      };
      winningOrder[key] = group.sortOrder;
    }
  }
  return config;
}

/**
 * Canonical most-general → most-specific ordering of common Nominatim place types, used only as the
 * fallback ordering for place types the user has not explicitly ordered in Settings.
 */
export const CANONICAL_PLACE_TYPE_ORDER = [
  "continent", "country", "state", "region", "province", "state_district", "county",
  "municipality", "city", "borough", "town", "village", "hamlet", "suburb", "quarter",
  "neighbourhood", "city_block", "island", "islet", "locality",
] as const;

/** Normalize a placeType string into its config key (trimmed/lowercased; null/blank → `""`). */
export function placeTypeKey(placeType: string | null | undefined): string {
  return (placeType ?? "").trim().toLowerCase();
}

/** What the map should do with a single location once the per-placeType config is applied. */
export type ResolvedLocationDisplay = "pin" | "area" | "hidden";

/**
 * Decide how a location renders given the per-placeType display config:
 * - a placeType whose setting is `visible: false` → `"hidden"` (omitted from the map);
 * - `displayMode: "pin"` → always a `"pin"`;
 * - `displayMode: "area"` → `"area"` when a boundary exists, else a `"pin"` fallback;
 * - an **unconfigured** placeType is treated as visible `area`, reproducing the legacy behavior
 *   (area when a boundary exists, else a pin).
 *
 * Pure helper — shared by the map renderer (client) and unit-tested directly.
 */
export function resolveLocationDisplay(
  node: { placeType: string | null;
    boundary?: LocationBoundary | null; },
  config: PlaceTypeDisplayConfig,
): ResolvedLocationDisplay {
  const setting = config[placeTypeKey(node.placeType)];
  if (setting && !setting.visible) return "hidden";
  const mode = setting?.displayMode ?? "area";
  if (mode === "pin") return "pin";
  return node.boundary ? "area" : "pin";
}

/**
 * The custom map color configured for a location's placeType, or `null` when its level has none (the
 * map then falls back to Leaflet's default blue). Pure helper — shared by the map renderer.
 */
export function resolveLocationColor(
  node: { placeType: string | null },
  config: PlaceTypeDisplayConfig,
): string | null {
  return config[placeTypeKey(node.placeType)]?.color ?? null;
}

/**
 * The Lucide icon name configured for a location's placeType, or `null` when its place type has none
 * (the map then draws a plain pin). Pure helper — the per-placeType sibling of {@link resolveLocationColor},
 * keyed off the standalone {@link PlaceTypeIconConfig} so it's independent of the level-group pipeline.
 */
export function resolveLocationIcon(
  node: { placeType: string | null },
  icons: PlaceTypeIconConfig,
): string | null {
  return icons[placeTypeKey(node.placeType)] ?? null;
}

/**
 * The per-placeType color override configured for a location's place type, or `null` when its place
 * type has none (the map then falls back to the level group's color, then Leaflet's default blue).
 * Re-normalizes the stored value so a malformed entry is ignored. Pure helper — the override-wins
 * sibling of {@link resolveLocationColor}, keyed off the standalone {@link PlaceTypeColorConfig}.
 */
export function resolveLocationPlaceTypeColor(
  node: { placeType: string | null },
  colors: PlaceTypeColorConfig,
): string | null {
  return normalizeHexColor(colors[placeTypeKey(node.placeType)]) ?? null;
}

/**
 * Order weight for a placeType: the user-set `sortOrder` when configured, otherwise its rank in
 * {@link CANONICAL_PLACE_TYPE_ORDER}, otherwise a large constant so unknown types sort last. Used by
 * the Settings list, the levels overlay, and the placeType tree sort so they agree on level order.
 */
export function placeTypeOrder(placeType: string | null, config: PlaceTypeDisplayConfig): number {
  const key = placeTypeKey(placeType);
  const setting = config[key];
  if (setting) return setting.sortOrder;
  const canonical = CANONICAL_PLACE_TYPE_ORDER.indexOf(key as (typeof CANONICAL_PLACE_TYPE_ORDER)[number]);
  return canonical === -1 ? Number.MAX_SAFE_INTEGER : canonical;
}
