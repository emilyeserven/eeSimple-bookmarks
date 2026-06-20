import type { ConditionTree, HomepageSection, HomepageSectionImageLayout } from "@eesimple/types";

import { useRef, useState } from "react";

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
  imageMode: string;
  imageLayout: HomepageSectionImageLayout;
}

interface HomepageSectionFormProps {
  section?: HomepageSection;
  /** Explicit-save mode (create): called when the Save button is clicked. */
  onSave?: (values: HomepageSectionFormValues) => void;
  /** Auto-save mode (edit): called on every field change so the parent can debounce + persist. */
  onChange?: (values: HomepageSectionFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
  /** When provided (editing an existing section), renders a Delete button in the actions row. */
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function HomepageSectionForm({
  section, onSave, onChange, onCancel, isPending, onDelete, isDeleting,
}: HomepageSectionFormProps) {
  const initialValues: HomepageSectionFormValues = {
    title: section?.title ?? "",
    description: section?.description ?? "",
    conditions: section?.conditions ?? emptyConditionTree(),
    hideIfEmpty: section?.hideIfEmpty ?? false,
    columns: section?.columns ?? 2,
    imageMode: section?.imageMode ?? "natural",
    imageLayout: section?.imageLayout ?? "above",
  };

  const [values, setValues] = useState<HomepageSectionFormValues>(initialValues);
  const valuesRef = useRef<HomepageSectionFormValues>(initialValues);

  function setField<K extends keyof HomepageSectionFormValues>(key: K, value: HomepageSectionFormValues[K]): void {
    const next = {
      ...valuesRef.current,
      [key]: value,
    };
    valuesRef.current = next;
    setValues(next);
    onChange?.(next);
  }

  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();

  const isAutoSave = onChange !== undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({
      ...valuesRef.current,
      title: valuesRef.current.title.trim(),
      description: valuesRef.current.description?.trim() || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <HomepageSectionFields
        idPrefix={`section-${section?.id ?? "new"}`}
        title={values.title}
        setTitle={v => setField("title", v)}
        description={values.description ?? ""}
        setDescription={v => setField("description", v)}
        columns={values.columns}
        setColumns={v => setField("columns", v)}
        imageMode={values.imageMode}
        setImageMode={v => setField("imageMode", v)}
        imageLayout={values.imageLayout}
        setImageLayout={v => setField("imageLayout", v)}
        hideIfEmpty={values.hideIfEmpty}
        setHideIfEmpty={v => setField("hideIfEmpty", v)}
        conditions={values.conditions}
        setConditions={v => setField("conditions", v)}
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
          conditions={values.conditions}
        />
      </section>

      <Separator />

      <div className="flex flex-wrap gap-2">
        {isAutoSave
          ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Done
            </Button>
          )
          : (
            <>
              <Button
                type="submit"
                disabled={isPending || !values.title.trim()}
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
            </>
          )}
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
