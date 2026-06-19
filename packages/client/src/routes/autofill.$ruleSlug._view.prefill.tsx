import type { AutofillRule } from "@eesimple/types";

import { createFileRoute } from "@tanstack/react-router";

import { AutofillPrefillFields } from "../components/AutofillRuleDetail";
import { AutofillRuleTabWrapper } from "../components/AutofillRuleTabWrapper";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useTags } from "../hooks/useTags";

export const Route = createFileRoute("/autofill/$ruleSlug/_view/prefill")({
  component: PrefillViewTab,
});

function PrefillViewTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <AutofillRuleTabWrapper
      ruleSlug={ruleSlug}
      title="What Gets Prefilled"
      description="Category, tags, and custom-property values set when this rule matches."
    >
      {rule => <PrefillViewContent rule={rule} />}
    </AutofillRuleTabWrapper>
  );
}

function PrefillViewContent({
  rule,
}: { rule: AutofillRule }) {
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
  return (
    <AutofillPrefillFields
      rule={rule}
      categories={categories}
      mediaTypes={mediaTypes}
      tags={tags}
      properties={properties}
    />
  );
}
