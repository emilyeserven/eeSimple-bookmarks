import type { CustomPropertyInputs } from "../components/bookmarkFormSchema";
import type { ConditionInput, CustomProperty } from "@eesimple/types";

import { buildAllPropertyValues } from "../components/bookmarkFormSchema";

/** The subset of the create-form's live values a condition can match on. */
export interface BookmarkFormConditionValues {
  url: string;
  title: string;
  /** Additional labelled name values (matched alongside `title`). */
  names: string[];
  categoryId: string;
  mediaTypeId: string;
  youtubeChannelId: string;
  tagIds: string[];
  locationIds: string[];
  genreMoodIds: string[];
}

/**
 * Project the partially-filled Add Bookmark form into a {@link ConditionInput} so the shared
 * `evaluateConditions` predicate can be run against it live (for the create form's Advanced Rules).
 * Mirrors `bookmarkToConditionInput` (which projects a *saved* `Bookmark`) but reads the live form
 * values and the in-progress custom-property inputs instead.
 *
 * Fields the create form doesn't carry — `relationshipTypeIds`, `languageUsages`, `fileValues` —
 * project empty, so a condition leaf on them simply can't fire yet (the same "not available at add
 * time" semantics as `urlTitleConditionInput`). Pure and unit-testable.
 */
export function formStateToConditionInput(
  values: BookmarkFormConditionValues,
  inputs: CustomPropertyInputs,
  customProperties: CustomProperty[],
): ConditionInput {
  const mediaTypeId = values.mediaTypeId || null;
  const propertyValues = buildAllPropertyValues(customProperties, values.categoryId, inputs, mediaTypeId);
  return {
    url: values.url,
    title: values.title,
    names: values.names,
    categoryId: values.categoryId,
    tagIds: new Set(values.tagIds),
    locationIds: new Set(values.locationIds),
    // G&M ids are taxonomy term ids now, matched via the taxonomy/legacy-genre-mood leaves.
    taxonomyTermIds: new Set(values.genreMoodIds),
    youtubeChannelId: values.youtubeChannelId || null,
    mediaTypeId,
    numberValues: new Map([
      ...propertyValues.numberValues.map(v => [v.propertyId, v.value] as const),
      ...propertyValues.progressValues.map(v => [v.propertyId, v.current] as const),
    ]),
    booleanValues: new Map(propertyValues.booleanValues.map(v => [v.propertyId, v.value])),
    dateTimeValues: new Map(propertyValues.dateTimeValues.map(v => [v.propertyId, v.value])),
    choicesValues: new Map(propertyValues.choicesValues.map(v => [v.propertyId, v.values])),
    sectionsValues: new Map(propertyValues.sectionsValues.map(v => [v.propertyId, v])),
    textValues: new Map(propertyValues.textValues.map(v => [v.propertyId, v.value])),
    // Not available while creating: no relationships/language-usages/file values on the create form.
    relationshipTypeIds: new Set(),
    languageUsages: [],
    fileValues: new Set(),
  };
}
