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
  romanizedName: string | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  placeType: string | null;
  countryCode: string | null;
}

/** A blank ancestor draft. */
export function emptyAncestorDraft(): AncestorDraft {
  return {
    existingId: null,
    name: "",
    romanizedName: null,
    latitude: null,
    longitude: null,
    mapUrl: null,
    placeType: null,
    countryCode: null,
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

/**
 * Shared name (+ metadata) schema for location forms. `parent` is always present in form state
 * (defaulting to the ROOT sentinel) even when no parent is chosen, so one schema covers both the
 * root and parented cases. Used by `LocationForm` (create, submit) and `LocationGeneralForm` (edit,
 * auto-save) so the two surfaces validate identically.
 */
export const locationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  mapUrl: z.string(),
  plusCode: z.string(),
  placeType: z.string(),
  countryCode: z.string(),
  parent: z.string(),
});
