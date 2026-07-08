import type { AutofillRule } from "@eesimple/types";

import { AutofillConditionsFields } from "../AutofillRuleDetail";

import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useLocations } from "@/hooks/useLocations";
import { useTags } from "@/hooks/useTags";

export { DebugView } from "./autofillDebugView";

export function ConditionsView({
  entity: rule,
}: {
  entity: AutofillRule;
}) {
  const {
    data: categories = [],
  } = useCategories();
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
    <AutofillConditionsFields
      rule={rule}
      categories={categories}
      tags={tags}
      properties={properties}
      locations={locations}
    />
  );
}
