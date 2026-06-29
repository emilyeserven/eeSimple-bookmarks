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
}

/** Response shape of `GET /api/locations/lookup`. */
export interface LocationLookupResult {
  results: LocationLookupCandidate[];
}
