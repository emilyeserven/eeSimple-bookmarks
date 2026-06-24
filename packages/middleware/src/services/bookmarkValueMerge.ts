import type { Bookmark, UpdateBookmarkInput } from "@eesimple/types";

/** The custom-property value arrays carried on both a hydrated bookmark and an update payload. */
type ValueKind
  = | "numberValues"
    | "booleanValues"
    | "dateTimeValues"
    | "choicesValues"
    | "progressValues";

type ValuePatch = Pick<UpdateBookmarkInput, ValueKind>;

/** Replace existing entries that share a `propertyId` with the incoming ones; keep the rest. */
function mergeByPropertyId<T extends { propertyId: string }>(existing: T[], incoming: T[]): T[] {
  const incomingIds = new Set(incoming.map(entry => entry.propertyId));
  return [...existing.filter(entry => !incomingIds.has(entry.propertyId)), ...incoming];
}

/**
 * Merge a partial set of custom-property values into a bookmark's existing values, per value kind,
 * keyed by `propertyId`. For each kind present in `patch`, the patch's entries replace any existing
 * entry for the same property while the bookmark's other values for that kind are preserved.
 *
 * This is required for bulk "set one property value": `updateBookmark` *replaces* whichever value
 * array it receives, so passing a bare single-entry array would wipe every other value of that kind.
 * Only kinds present in `patch` are returned, so the merged result can be spread over the patch.
 */
export function mergeBookmarkValues(
  existing: Pick<Bookmark, ValueKind>,
  patch: ValuePatch,
): ValuePatch {
  const merged: ValuePatch = {};
  if (patch.numberValues !== undefined) {
    merged.numberValues = mergeByPropertyId(existing.numberValues, patch.numberValues);
  }
  if (patch.booleanValues !== undefined) {
    merged.booleanValues = mergeByPropertyId(existing.booleanValues, patch.booleanValues);
  }
  if (patch.dateTimeValues !== undefined) {
    merged.dateTimeValues = mergeByPropertyId(existing.dateTimeValues, patch.dateTimeValues);
  }
  if (patch.choicesValues !== undefined) {
    merged.choicesValues = mergeByPropertyId(existing.choicesValues, patch.choicesValues);
  }
  if (patch.progressValues !== undefined) {
    merged.progressValues = mergeByPropertyId(existing.progressValues, patch.progressValues);
  }
  return merged;
}

/** True when the update payload touches at least one custom-property value array. */
export function hasValuePatch(patch: UpdateBookmarkInput): boolean {
  return (
    patch.numberValues !== undefined
    || patch.booleanValues !== undefined
    || patch.dateTimeValues !== undefined
    || patch.choicesValues !== undefined
    || patch.progressValues !== undefined
  );
}
