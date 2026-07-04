import type { CardDisplayRule } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { ConditionsField } from "./conditions/ConditionsField";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { useCardDisplayRuleConditionsForm } from "./useCardDisplayRuleConditionsForm";

import { LabeledSection } from "@/components/LabeledSection";
import { Separator } from "@/components/ui/separator";

interface Props {
  entity: CardDisplayRule;
}

/**
 * Edit which bookmarks a card display rule matches. The `conditions` tree auto-saves on change (no
 * Save button). Not rendered for the Default rule (it matches every card unconditionally).
 */
export function CardDisplayRuleConditionsForm({
  entity: rule,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    categories,
    properties,
    tagTree,
    conditions,
    handleChange,
  } = useCardDisplayRuleConditionsForm(rule);

  return (
    <div className="space-y-6">
      <ConditionsField
        value={conditions}
        onChange={handleChange}
        categories={categories}
        properties={properties}
        tagTree={tagTree}
      />

      <Separator />

      <LabeledSection
        title={t("Preview Bookmarks")}
        description={t("Test which existing bookmarks match the conditions above.")}
      >
        <PreviewBookmarksSection conditions={conditions} />
      </LabeledSection>
    </div>
  );
}
