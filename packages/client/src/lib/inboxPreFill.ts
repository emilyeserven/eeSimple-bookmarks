import type { CustomProperty, CustomPropertyType, InboxPreFillDefaults } from "@eesimple/types";

/**
 * Types that can be meaningfully pre-filled before bookmark creation — a deliberate subset of
 * `CUSTOM_PROPERTY_TYPES` (the value-carrying kinds the inbox pre-fill form can stage), not a
 * hand-mirrored copy of the full tuple. `satisfies` makes a renamed/removed type fail `tsc` here.
 */
const INBOX_PREFILLABLE_TYPE_LIST = ["number", "boolean", "datetime", "choices", "ratingScale"] as const satisfies readonly CustomPropertyType[];

export const INBOX_PREFILLABLE_TYPES = new Set<CustomProperty["type"]>(INBOX_PREFILLABLE_TYPE_LIST);

export function isPreFillEmpty(preFill: InboxPreFillDefaults): boolean {
  return (
    !preFill.categoryId
    && (!preFill.tagIds || preFill.tagIds.length === 0)
    && !preFill.mediaTypeId
    && (!preFill.personIds || preFill.personIds.length === 0)
    && (!preFill.numberValues || preFill.numberValues.length === 0)
    && (!preFill.booleanValues || preFill.booleanValues.length === 0)
    && (!preFill.dateTimeValues || preFill.dateTimeValues.length === 0)
    && (!preFill.choicesValues || preFill.choicesValues.length === 0)
  );
}
