import type { AutofillRule } from "@eesimple/types";

import { prefillPropertyRows } from "../autofillPrefillRows";
import {
  PrefillCategoryBlock,
  PrefillLocationsBlock,
  PrefillMediaTypeBlock,
  PrefillPropertiesBlock,
  PrefillTagsBlock,
} from "../AutofillRuleDetail";

import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useLocations } from "@/hooks/useLocations";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { useTags } from "@/hooks/useTags";

/**
 * The five prefill view fields (#1197) — one per placeable {@link ../workbench/autofill} field. Each
 * loads only the taxonomy it needs and delegates to the shared presentational block, so the layout
 * seam can render them independently (mirrors the bookmark `bookmarkViewFields.tsx` pattern).
 */

/** View field: the category the rule sets. */
export function AutofillPrefillCategoryView({
  entity: rule,
}: { entity: AutofillRule }) {
  const {
    data: categories = [],
  } = useCategories();
  const name = rule.setCategoryId
    ? (categories.find(c => c.id === rule.setCategoryId)?.name ?? null)
    : null;
  return <PrefillCategoryBlock categoryName={name} />;
}

/** View field: the media type the rule sets. */
export function AutofillPrefillMediaTypeView({
  entity: rule,
}: { entity: AutofillRule }) {
  const {
    data: mediaTypes = [],
  } = useMediaTypes();
  const name = rule.setMediaTypeId
    ? (mediaTypes.find(m => m.id === rule.setMediaTypeId)?.name ?? null)
    : null;
  return <PrefillMediaTypeBlock mediaTypeName={name} />;
}

/** View field: the tags the rule applies. */
export function AutofillPrefillTagsView({
  entity: rule,
}: { entity: AutofillRule }) {
  const {
    data: tags = [],
  } = useTags();
  const tagNames = rule.tagIds.map(id => tags.find(tag => tag.id === id)?.name ?? id);
  return <PrefillTagsBlock tagNames={tagNames} />;
}

/** View field: the locations the rule applies. */
export function AutofillPrefillLocationsView({
  entity: rule,
}: { entity: AutofillRule }) {
  const {
    data: locations = [],
  } = useLocations();
  const locationNames = rule.locationIds.map(id => locations.find(l => l.id === id)?.name ?? id);
  return <PrefillLocationsBlock locationNames={locationNames} />;
}

/** View field: the custom-property values the rule sets. */
export function AutofillPrefillPropertiesView({
  entity: rule,
}: { entity: AutofillRule }) {
  const {
    data: properties = [],
  } = useCustomProperties();
  return <PrefillPropertiesBlock propertyValues={prefillPropertyRows(rule, properties)} />;
}
