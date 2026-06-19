import type { ConditionTree, HomepageSection, HomepageSectionImageLayout } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { HomepageSectionFields } from "./HomepageSectionFields";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
      <HomepageSectionFields
        idPrefix={`section-${section?.id ?? "new"}`}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        columns={columns}
        setColumns={setColumns}
        imageMode={imageMode}
        setImageMode={setImageMode}
        imageLayout={imageLayout}
        setImageLayout={setImageLayout}
        hideIfEmpty={hideIfEmpty}
        setHideIfEmpty={setHideIfEmpty}
        conditions={conditions}
        setConditions={setConditions}
        displayDefaultOpen={!section}
        filterDefaultOpen={(section?.conditions.children.length ?? 0) > 0}
        categories={categories ?? []}
        properties={properties ?? []}
        tagTree={tagTree ?? []}
      />

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
