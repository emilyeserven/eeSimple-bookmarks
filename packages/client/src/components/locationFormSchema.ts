import { z } from "zod";

/** One ancestor row's editable fields, ordered immediate-parent-first up to the root. */
export interface AncestorDraft {
  name: string;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  placeType: string | null;
  countryCode: string | null;
}

/** A blank ancestor draft. */
export function emptyAncestorDraft(): AncestorDraft {
  return {
    name: "",
    latitude: null,
    longitude: null,
    mapUrl: null,
    placeType: null,
    countryCode: null,
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
