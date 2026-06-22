import type { BookmarkImageVisibility, CardFieldZones, CardZoneLayouts, ConditionTree, HomepageSection, HomepageSectionImageLayout, ViewMode } from "@eesimple/types";

import { useRef, useState } from "react";

import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";

import { HomepageSectionFields } from "./HomepageSectionFields";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { defaultCardFieldZones } from "../lib/bookmarkCardValues";

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
  imageVisibility: BookmarkImageVisibility;
  viewMode: ViewMode;
  fieldZones: CardFieldZones;
  cardZoneLayouts: CardZoneLayouts;
  hideWebsiteForYouTube: boolean;
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
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
  // Seed the zone board for a section that has none yet (legacy / brand-new): use the Default card
  // display rule's zones (what the section currently shows), falling back to the standard defaults.
  const defaultZones = useDefaultFieldZones();

  const initialValues: HomepageSectionFormValues = {
    title: section?.title ?? "",
    description: section?.description ?? "",
    conditions: section?.conditions ?? emptyConditionTree(),
    hideIfEmpty: section?.hideIfEmpty ?? false,
    columns: section?.columns ?? 2,
    imageMode: section?.imageMode ?? "natural",
    imageLayout: section?.imageLayout ?? "above",
    imageVisibility: section?.imageVisibility ?? "shown",
    viewMode: section?.viewMode ?? "cards",
    fieldZones: section?.fieldZones ?? defaultZones ?? defaultCardFieldZones(properties ?? []),
    cardZoneLayouts: section?.cardZoneLayouts ?? defaultCardZoneLayouts(),
    hideWebsiteForYouTube: section?.hideWebsiteForYouTube ?? false,
  };

  const [values, setValues] = useState<HomepageSectionFormValues>(initialValues);
  const valuesRef = useRef<HomepageSectionFormValues>(initialValues);

  function setFields(patch: Partial<HomepageSectionFormValues>): void {
    const next = {
      ...valuesRef.current,
      ...patch,
    };
    valuesRef.current = next;
    setValues(next);
    onChange?.(next);
  }

  function setField<K extends keyof HomepageSectionFormValues>(key: K, value: HomepageSectionFormValues[K]): void {
    setFields({
      [key]: value,
    });
  }

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
        display={{
          viewMode: values.viewMode,
          columns: values.columns,
          imageMode: values.imageMode,
          imageVisibility: values.imageVisibility,
          imageLayout: values.imageLayout,
          fieldZones: values.fieldZones,
          cardZoneLayouts: values.cardZoneLayouts,
          hideWebsiteForYouTube: values.hideWebsiteForYouTube,
        }}
        onDisplayChange={setFields}
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
