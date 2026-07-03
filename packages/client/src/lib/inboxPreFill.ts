import type { CustomProperty, InboxPreFillDefaults } from "@eesimple/types";

/** Types that can be meaningfully pre-filled before bookmark creation. */
export const INBOX_PREFILLABLE_TYPES = new Set<CustomProperty["type"]>(["number", "boolean", "datetime", "choices", "ratingScale"]);

export function isPreFillEmpty(preFill: InboxPreFillDefaults): boolean {
  return (
    !preFill.categoryId
    && (!preFill.tagIds || preFill.tagIds.length === 0)
    && !preFill.mediaTypeId
    && (!preFill.personIds || preFill.personIds.length === 0)
    && !preFill.groupId
    && (!preFill.numberValues || preFill.numberValues.length === 0)
    && (!preFill.booleanValues || preFill.booleanValues.length === 0)
    && (!preFill.dateTimeValues || preFill.dateTimeValues.length === 0)
    && (!preFill.choicesValues || preFill.choicesValues.length === 0)
  );
}
