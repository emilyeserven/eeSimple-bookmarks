import type {
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CreateBookmarkInput,
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

/** Dedup-union the pre-fill and autofill location ids applied to an approved bookmark. */
export function mergeApprovalLocationIds(
  preFillLocationIds: string[] | undefined,
  autofillLocationIds: string[],
): string[] {
  return [...new Set([...(preFillLocationIds ?? []), ...autofillLocationIds])];
}

/**
 * Resolve the category id for an approved item by precedence:
 * per-item override > pre-fill > import default > newsletter default > autofill.
 * `undefined` (none set) lets `createBookmark` apply its website/channel/built-in default precedence.
 */
export function pickApprovalCategoryId(candidates: {
  itemCategoryId?: string | null;
  preFillCategoryId?: string | null;
  importDefaultCategoryId?: string | null;
  newsletterDefaultCategoryId?: string | null;
  autofillCategoryId?: string | null;
}): string | undefined {
  return (
    candidates.itemCategoryId
    ?? candidates.preFillCategoryId
    ?? candidates.importDefaultCategoryId
    ?? candidates.newsletterDefaultCategoryId
    ?? candidates.autofillCategoryId
    ?? undefined
  );
}

/** The bookmark fields an import contributes to each approved item (newsletter defaults + link). */
export interface ApprovalBookmarkDefaults {
  importId: string;
  newsletterId: string | null;
  categoryId?: string;
  mediaTypeId?: string | null;
  tagIds?: string[];
}

/**
 * Assemble the `createBookmark` input for an approved item, applying the per-field precedence
 * (pre-fill > import default > autofill) and dropping empty value arrays. Pure — the DB lookups and
 * the resolved `categoryId` are done by the caller and passed in.
 */
export function buildApprovalBookmarkInput(args: {
  url: string;
  title: string;
  item: { newsletterContext?: string | null;
    description?: string | null; };
  defaults: ApprovalBookmarkDefaults;
  preFill: InboxPreFillDefaults | undefined;
  autofillTagIds: string[];
  autofillLocationIds: string[];
  autofillMediaTypeId?: string | null;
  mergedNumberValues: BookmarkNumberValue[];
  mergedBooleanValues: BookmarkBooleanValue[];
  mergedDateTimeValues: BookmarkDateTimeValue[];
  categoryId: string | undefined;
}): CreateBookmarkInput {
  const {
    url, title, item, defaults, preFill, autofillTagIds, autofillLocationIds, autofillMediaTypeId,
    mergedNumberValues, mergedBooleanValues, mergedDateTimeValues, categoryId,
  } = args;
  return {
    url,
    title,
    // Save the source passage (newsletter context) as the description; fall back to the item's own.
    description: item.newsletterContext ?? item.description ?? null,
    ...defaults,
    tagIds: mergeApprovalTagIds(defaults.tagIds, preFill?.tagIds, autofillTagIds),
    locationIds: mergeApprovalLocationIds(preFill?.locationIds, autofillLocationIds),
    mediaTypeId: preFill?.mediaTypeId ?? defaults.mediaTypeId ?? autofillMediaTypeId,
    personIds: preFill?.personIds,
    groupIds: preFill?.groupIds,
    numberValues: mergedNumberValues.length > 0 ? mergedNumberValues : undefined,
    booleanValues: mergedBooleanValues.length > 0 ? mergedBooleanValues : undefined,
    dateTimeValues: mergedDateTimeValues.length > 0 ? mergedDateTimeValues : undefined,
    choicesValues: preFill?.choicesValues,
    categoryId,
  };
}
