import type {
  Category,
  ConditionTree,
  CustomProperty,
  TagNode,
} from "@eesimple/types";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { ConditionsField } from "./conditions/ConditionsField";
import { conditionsDetailedLabel } from "./conditions/summarizeConditions";
import { LabeledSection } from "./LabeledSection";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";

import { Separator } from "@/components/ui/separator";

interface AutofillRuleActivationSectionProps {
  defaultOpen: boolean;
  conditions: ConditionTree;
  conditionsError: string | null;
  onChange: (next: ConditionTree) => void;
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
  openCustomProperties?: boolean;
}

/** The "Activation Conditions" collapsible plus the "Preview Bookmarks" section beneath it. */
export function AutofillRuleActivationSection({
  defaultOpen, conditions, conditionsError, onChange, categories, properties, tagTree, openCustomProperties,
}: AutofillRuleActivationSectionProps) {
  return (
    <>
      <CollapsibleFormSection
        title="Activation Conditions"
        description="Conditions that decide whether this rule applies."
        defaultOpen={defaultOpen}
        preview={conditionsDetailedLabel(conditions)}
      >
        <div className="space-y-1">
          <ConditionsField
            value={conditions}
            onChange={onChange}
            categories={categories}
            properties={properties}
            tagTree={tagTree}
            openCustomProperties={openCustomProperties}
          />
          {conditionsError ? <p className="text-sm text-destructive">{conditionsError}</p> : null}
        </div>
      </CollapsibleFormSection>

      <Separator />

      <LabeledSection
        title="Preview Bookmarks"
        description="Test which existing bookmarks match the activation conditions above."
      >
        <PreviewBookmarksSection
          conditions={conditions}
        />
      </LabeledSection>
    </>
  );
}
