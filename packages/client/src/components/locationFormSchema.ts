import type { CreateLocationInput, LocationLookupAncestor } from "@eesimple/types";

import { z } from "zod";

/** One ancestor row's editable fields, ordered immediate-parent-first up to the root. */
export interface AncestorDraft {
  /**
   * When set, this row reuses an existing location instead of creating a new one. An existing row
   * caps the chain (the reused location already has its own ancestors), so the other fields are
   * ignored and no rows sit above it.
   */
  existingId: string | null;
  name: string;
  englishName: string | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  placeType: string | null;
  countryCode: string | null;
  /** The ancestor's Wikidata QID when it was resolved via the Wikidata fallback, else `null`. */
  wikidataId: string | null;
}

/** Drop a draft ancestor's empty optional fields into a `CreateLocationInput` (the to-be-created level). */
export function ancestorToInput(draft: AncestorDraft): CreateLocationInput {
  return {
    name: draft.name.trim(),
    englishName: draft.englishName?.trim() || null,
    latitude: draft.latitude,
    longitude: draft.longitude,
    mapUrl: draft.mapUrl,
    placeType: draft.placeType,
    countryCode: draft.countryCode,
    wikidataId: draft.wikidataId,
    usesWikidataCoordinates: draft.wikidataId != null,
  };
}

/** A blank ancestor draft. */
export function emptyAncestorDraft(): AncestorDraft {
  return {
    existingId: null,
    name: "",
    englishName: null,
    latitude: null,
    longitude: null,
    mapUrl: null,
    placeType: null,
    countryCode: null,
    wikidataId: null,
  };
}

/** The new-vs-existing split of an ancestor chain, ready to feed `CreateLocationChainInput`. */
export interface AncestorChainSplit {
  /** The named, to-be-created ancestor rows (immediate-parent-first). */
  newAncestors: AncestorDraft[];
  /** The existing location the chain's top attaches to, or `null` to build from the root. */
  parentId: string | null;
}

/**
 * Reduce the editor's ancestor rows to the chain payload: the new (named) rows to create and the
 * existing-location id the top of the chain anchors to. An existing row caps the chain — the editor
 * keeps it topmost, so it supplies `parentId` and rows above it (if any) are ignored here.
 */
export function splitAncestorChain(ancestors: AncestorDraft[]): AncestorChainSplit {
  const existingTop = ancestors.find(a => a.existingId != null);
  return {
    newAncestors: ancestors.filter(a => a.existingId == null && a.name.trim().length > 0),
    parentId: existingTop?.existingId ?? null,
  };
}

/** A minimal existing-location shape used to match geocoded ancestors against the saved tree. */
export interface ExistingLocationMatch {
  id: string;
  name: string;
  englishName?: string | null;
}

/**
 * Turn the geocoded ancestors of a looked-up place into editor rows (immediate-parent-first),
 * pre-matching each level against the already-saved locations so existing places are reused rather
 * than recreated. For each ancestor we look for an existing location whose `name` or `englishName`
 * equals the ancestor's name (case-insensitive). The **first** ancestor with exactly one such match
 * caps the chain: that row reuses the existing location (its own ancestry takes over) and no rows are
 * emitted above it. Ancestors below the cap — and any with zero or multiple matches — become new
 * drafts the user can still edit or point at an existing location via the row's picker.
 */
export function geocodedAncestorsToDrafts(
  ancestors: LocationLookupAncestor[],
  existing: ExistingLocationMatch[],
): AncestorDraft[] {
  function singleMatchId(name: string): string | null {
    const needle = name.trim().toLowerCase();
    if (needle === "") return null;
    const matches = existing.filter((loc) => {
      const names = [loc.name, loc.englishName ?? ""];
      return names.some(n => n.trim().toLowerCase() === needle);
    });
    return matches.length === 1 ? matches[0].id : null;
  }

  const drafts: AncestorDraft[] = [];
  for (const ancestor of ancestors) {
    const existingId = singleMatchId(ancestor.name);
    if (existingId !== null) {
      // Reuse caps the chain: emit the existing row and stop (it supplies its own ancestry).
      drafts.push({
        ...emptyAncestorDraft(),
        existingId,
        name: ancestor.name,
        placeType: ancestor.placeType,
        countryCode: ancestor.countryCode,
        wikidataId: ancestor.wikidataId,
      });
      break;
    }
    drafts.push({
      ...emptyAncestorDraft(),
      name: ancestor.name,
      placeType: ancestor.placeType,
      countryCode: ancestor.countryCode,
      wikidataId: ancestor.wikidataId,
    });
  }
  return drafts;
}

/**
 * Shared name (+ metadata) schema for location forms. `parent` is always present in form state
 * (defaulting to the ROOT sentinel) even when no parent is chosen, so one schema covers both the
 * root and parented cases. Used by `LocationForm` (create, submit) and `LocationGeneralForm` (edit,
 * auto-save) so the two surfaces validate identically.
 */
export const locationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  englishName: z.string(),
  description: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  mapUrl: z.string(),
  plusCode: z.string(),
  placeType: z.string(),
  countryCode: z.string(),
  officialLink: z.string(),
  wikipediaLinkEn: z.string(),
  wikipediaLinkLocal: z.string(),
  parent: z.string(),
});
