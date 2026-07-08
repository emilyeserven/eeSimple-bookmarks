import type { AutofillRule } from "@eesimple/types";

import {
  AutofillPrefillCategoryField,
  AutofillPrefillLocationsField,
  AutofillPrefillMediaTypeField,
  AutofillPrefillPropertiesField,
  AutofillPrefillTagsField,
} from "./AutofillPrefillEditFields";

interface Props {
  rule: AutofillRule;
}

/**
 * Edit an autofill rule's prefill actions: category, media type, tags, locations, and property
 * values. Recomposed (#1197) from the five independently-placeable edit fields in
 * {@link ./AutofillPrefillEditFields} so its story stays unchanged while each field can be surfaced
 * on its own Page Layouts field. Each picker auto-saves its own field on change (no Save button).
 */
export function AutofillRulePrefillForm({
  rule,
}: Props) {
  return (
    <div className="space-y-4">
      <AutofillPrefillCategoryField rule={rule} />
      <AutofillPrefillMediaTypeField rule={rule} />
      <AutofillPrefillTagsField rule={rule} />
      <AutofillPrefillLocationsField rule={rule} />
      <AutofillPrefillPropertiesField rule={rule} />
    </div>
  );
}
