import type {
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  InboxPreFillDefaults,
} from "@eesimple/types";

/** The property values an autofill evaluation produced for an item being approved. */
export interface ApprovalAutofillValues {
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
}

/**
 * Merge autofill-evaluated property values with the user's inbox pre-fill values. Autofill wins for
 * any property id it sets (across *all* value kinds — so a pre-fill value is dropped if autofill
 * already touched that property as any kind); pre-fill fills in the rest.
 */
export function mergeApprovalPropertyValues(
  autofill: ApprovalAutofillValues,
  preFill: InboxPreFillDefaults | undefined,
): ApprovalAutofillValues {
  const autofillPropertyIds = new Set<string>([
    ...autofill.numberValues.map(v => v.propertyId),
    ...autofill.booleanValues.map(v => v.propertyId),
    ...autofill.dateTimeValues.map(v => v.propertyId),
  ]);
  const keep = <T extends { propertyId: string }>(values: T[] | undefined): T[] =>
    (values ?? []).filter(v => !autofillPropertyIds.has(v.propertyId));
  return {
    numberValues: [...autofill.numberValues, ...keep(preFill?.numberValues)],
    booleanValues: [...autofill.booleanValues, ...keep(preFill?.booleanValues)],
    dateTimeValues: [...autofill.dateTimeValues, ...keep(preFill?.dateTimeValues)],
  };
}

/** The bookmark title for an approved item: its own title, else its anchor text, else the URL. */
export function approvalTitle(item: { title?: string | null;
  anchorText?: string | null;
  url: string; }): string {
  return item.title?.trim() || item.anchorText?.trim() || item.url;
}

/** Dedup-union the import-default, pre-fill, and autofill tag ids applied to an approved bookmark. */
export function mergeApprovalTagIds(
  defaultTagIds: string[] | undefined,
  preFillTagIds: string[] | undefined,
  autofillTagIds: string[],
): string[] {
  return [...new Set([...(defaultTagIds ?? []), ...(preFillTagIds ?? []), ...autofillTagIds])];
}
