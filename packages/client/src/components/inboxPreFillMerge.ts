import type { InboxPreFillDefaults } from "@eesimple/types";

/**
 * Merge an inbox row's per-item advanced edits over the batch-level prefill. Per-item scalar values
 * take precedence over the batch (`itemPreFill.x ?? batch.x`); tags are unioned (item first); people
 * use the item's list when non-empty, else the batch's. The custom-property value arrays come only
 * from the batch prefill (there's no per-item editor for them). Pure — unit-tested directly.
 */
export function mergeInboxPreFill(
  itemPreFill: InboxPreFillDefaults,
  batchPreFill: InboxPreFillDefaults | undefined,
): InboxPreFillDefaults {
  return {
    categoryId: itemPreFill.categoryId ?? batchPreFill?.categoryId,
    mediaTypeId: itemPreFill.mediaTypeId ?? batchPreFill?.mediaTypeId,
    tagIds: [...(itemPreFill.tagIds ?? []), ...(batchPreFill?.tagIds ?? [])],
    locationIds: [...(itemPreFill.locationIds ?? []), ...(batchPreFill?.locationIds ?? [])],
    personIds: itemPreFill.personIds?.length ? itemPreFill.personIds : batchPreFill?.personIds,
    groupId: itemPreFill.groupId ?? batchPreFill?.groupId,
    numberValues: batchPreFill?.numberValues,
    booleanValues: batchPreFill?.booleanValues,
    dateTimeValues: batchPreFill?.dateTimeValues,
    choicesValues: batchPreFill?.choicesValues,
  };
}
