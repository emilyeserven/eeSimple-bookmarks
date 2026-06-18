import type { ConditionTree, HomepageSection, HomepageSectionImageLayout } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";
import { ConditionsField } from "./conditions/ConditionsField";
import { conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { SectionDisplayControls } from "./SectionDisplayControls";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface HomepageSectionFormValues {
  title: string;
  description: string | null;
  conditions: ConditionTree;
  hideIfEmpty: boolean;
  columns: number;
  imageMode: boolean;
  imageLayout: HomepageSectionImageLayout;
}

interface HomepageSectionFormProps {
  section?: HomepageSection;
  onSave: (values: HomepageSectionFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
  /** When provided (editing an existing section), renders a Delete button in the actions row. */
  onDelete?: () => void;
  isDeleting?: boolean;
}

function displayPreview(
  columns: number,
  imageMode: boolean,
  imageLayout: HomepageSectionImageLayout,
  hideIfEmpty: boolean,
): string {
  const parts = [
    `${columns} ${columns === 1 ? "column" : "columns"}`,
    imageMode ? "Natural" : "Cropped",
  ];
  if (columns === 2) parts.push(imageLayout === "side" ? "Side" : "Above");
  if (hideIfEmpty) parts.push("Hidden when empty");
  return parts.join(" · ");
}

export function HomepageSectionForm({
  section, onSave, onCancel, isPending, onDelete, isDeleting,
}: HomepageSectionFormProps) {
  const [title, setTitle] = useState(section?.title ?? "");
  const [description, setDescription] = useState(section?.description ?? "");
  const [conditions, setConditions] = useState<ConditionTree>(
    section?.conditions ?? emptyConditionTree(),
  );
  const [hideIfEmpty, setHideIfEmpty] = useState(section?.hideIfEmpty ?? false);
  const [columns, setColumns] = useState(section?.columns ?? 2);
  const [imageMode, setImageMode] = useState(section?.imageMode ?? true);
  const [imageLayout, setImageLayout] = useState<HomepageSectionImageLayout>(
    section?.imageLayout ?? "above",
  );

  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      conditions,
      hideIfEmpty,
      columns,
      imageMode,
      imageLayout,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
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
        defaultOpen={!section}
        preview={displayPreview(columns, imageMode, imageLayout, hideIfEmpty)}
      >
        <SectionDisplayControls
          idPrefix={`section-${section?.id ?? "new"}`}
          columns={columns}
          imageMode={imageMode}
          imageLayout={imageLayout}
          onColumnsChange={setColumns}
          onImageModeChange={setImageMode}
          onImageLayoutChange={setImageLayout}
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
        defaultOpen={(section?.conditions.children.length ?? 0) > 0}
        preview={conditionsSummaryLabel(conditions)}
      >
        <ConditionsField
          value={conditions}
          onChange={setConditions}
          categories={categories ?? []}
          properties={properties ?? []}
          tagTree={tagTree ?? []}
        />
      </CollapsibleFormSection>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Preview Bookmarks</h3>
          <p className="text-xs text-muted-foreground">
            Test which existing bookmarks match the filter above.
          </p>
        </div>
        <PreviewBookmarksSection
          conditions={conditions}
          tagTree={tagTree ?? []}
        />
      </section>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={isPending || !title.trim()}
        >
          {isPending ? "Saving…" : "Save section"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        {onDelete
          ? (
            <Button
              type="button"
              variant="destructive"
              className="ml-auto"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete section"}
            </Button>
          )
          : null}
      </div>
    </form>
  );
}
