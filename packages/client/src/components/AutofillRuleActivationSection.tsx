import type {
  Category,
  CategoryCondition,
  ConditionTree,
  CustomProperty,
  TagCondition,
  TagNode,
  WebsiteCondition,
  YouTubeChannelCondition,
} from "@eesimple/types";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { ConditionsField } from "./conditions/ConditionsField";
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
        preview={summarizeConditions(conditions)}
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

/** One-line summary of the activation conditions for the collapsed section preview. */
function summarizeConditions(conditions: ConditionTree): string {
  const matchCount = conditions.children.filter(child => child.type === "match").length;
  const categoryLeaf = conditions.children.find((child): child is CategoryCondition => child.type === "category");
  const websiteLeaf = conditions.children.find((child): child is WebsiteCondition => child.type === "website");
  const tagLeaf = conditions.children.find((child): child is TagCondition => child.type === "tag");
  const channelLeaf = conditions.children.find((child): child is YouTubeChannelCondition => child.type === "youtube-channel");
  const propertyCount = conditions.children.filter(child => child.type === "property").length;
  const categoryCount = categoryLeaf?.categoryIds.length ?? 0;
  const websiteCount = websiteLeaf?.domains.length ?? 0;
  const tagCount = tagLeaf?.tagIds.length ?? 0;
  const channelCount = channelLeaf?.channelIds.length ?? 0;

  const parts: string[] = [];
  if (matchCount > 0) parts.push(`${matchCount} title ${matchCount === 1 ? "match" : "matches"}`);
  if (categoryCount > 0) parts.push(`${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`);
  if (websiteCount > 0) parts.push(`${websiteCount} ${websiteCount === 1 ? "website" : "websites"}`);
  if (tagCount > 0) parts.push(`${tagCount} ${tagCount === 1 ? "tag" : "tags"}`);
  if (channelCount > 0) parts.push(`${channelCount} YouTube ${channelCount === 1 ? "channel" : "channels"}`);
  if (propertyCount > 0) parts.push(`${propertyCount} ${propertyCount === 1 ? "property" : "properties"}`);

  return parts.length > 0 ? parts.join(" · ") : "No conditions set";
}
