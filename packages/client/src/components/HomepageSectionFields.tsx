import type { SectionDisplayValue } from "./SectionDisplaySettings";
import type { Category, ConditionTree, CustomProperty, TagNode } from "@eesimple/types";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { ConditionsField } from "./conditions/ConditionsField";
import { conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { SectionDisplaySettings } from "./SectionDisplaySettings";
import { sectionDisplayPreview } from "../lib/sectionDisplayPreview";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface HomepageSectionFieldsProps {
  idPrefix: string;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  display: SectionDisplayValue;
  onDisplayChange: (patch: Partial<SectionDisplayValue>) => void;
  hideIfEmpty: boolean;
  setHideIfEmpty: (value: boolean) => void;
  conditions: ConditionTree;
  setConditions: (value: ConditionTree) => void;
  displayDefaultOpen: boolean;
  filterDefaultOpen: boolean;
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
}

/** The General + Display + Filter collapsible sections shared by the homepage section form. */
export function HomepageSectionFields({
  idPrefix,
  title, setTitle,
  description, setDescription,
  display, onDisplayChange,
  hideIfEmpty, setHideIfEmpty,
  conditions, setConditions,
  displayDefaultOpen,
  filterDefaultOpen,
  categories,
  properties,
  tagTree,
}: HomepageSectionFieldsProps) {
  return (
    <>
      <CollapsibleFormSection
        title="General"
        description="Name and description shown above the section's bookmarks."
        defaultOpen
        preview={title.trim() || "Untitled section"}
      >
        <div className="space-y-1">
          <Label htmlFor="section-title">Name</Label>
          <Input
            id="section-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Section name"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="section-description">Description</Label>
          <Textarea
            id="section-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description shown above the bookmarks"
            rows={2}
          />
        </div>
      </CollapsibleFormSection>

      <Separator />

      <CollapsibleFormSection
        title="Display"
        description="How this section's bookmarks are laid out on the homepage."
        defaultOpen={displayDefaultOpen}
        preview={sectionDisplayPreview(display, hideIfEmpty)}
      >
        <SectionDisplaySettings
          idPrefix={idPrefix}
          value={display}
          onChange={onDisplayChange}
          properties={properties}
        />

        <div className="flex items-start gap-2">
          <Checkbox
            id="section-hide-if-empty"
            checked={hideIfEmpty}
            onCheckedChange={checked => setHideIfEmpty(checked === true)}
          />
          <div className="space-y-0.5">
            <Label
              htmlFor="section-hide-if-empty"
              className="cursor-pointer"
            >
              Hide when empty
            </Label>
            <p className="text-sm text-muted-foreground">
              Don&rsquo;t show this section when no bookmarks match its filter.
            </p>
          </div>
        </div>
      </CollapsibleFormSection>

      <Separator />

      <CollapsibleFormSection
        title="Filter"
        description="Choose which bookmarks appear in this section. Combine conditions with AND/OR."
        defaultOpen={filterDefaultOpen}
        preview={conditionsSummaryLabel(conditions)}
      >
        <ConditionsField
          value={conditions}
          onChange={setConditions}
          categories={categories}
          properties={properties}
          tagTree={tagTree}
        />
      </CollapsibleFormSection>
    </>
  );
}
