import type { AutofillRule } from "@eesimple/types";

import { AutofillPrefillFields } from "../AutofillRuleDetail";

import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useLocations } from "@/hooks/useLocations";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { useTags } from "@/hooks/useTags";

export function PrefillView({
  entity: rule,
}: {
  entity: AutofillRule;
}) {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypes = [],
  } = useMediaTypes();
  const {
    data: tags = [],
  } = useTags();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    data: locations = [],
  } = useLocations();
  return (
    <AutofillPrefillFields
      rule={rule}
      categories={categories}
      mediaTypes={mediaTypes}
      tags={tags}
      properties={properties}
      locations={locations}
    />
  );
}
