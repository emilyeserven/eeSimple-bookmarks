import type { HomepageSectionFormValues } from "./homepageSectionForm";
import type { HomepageSection } from "@eesimple/types";

import { useRef, useState } from "react";

import { HomepageSectionFields } from "./HomepageSectionFields";
import { buildHomepageSectionInitialValues } from "./homepageSectionForm";
import { HomepageSectionFormActions } from "./HomepageSectionFormActions";
import { HomepageSectionPreview } from "./HomepageSectionPreview";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";

import { Separator } from "@/components/ui/separator";

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

  const initialValues = buildHomepageSectionInitialValues(section, defaultZones, properties);

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
          bookmarkLimit: values.bookmarkLimit,
        }}
        onDisplayChange={setFields}
        hideIfEmpty={values.hideIfEmpty}
        setHideIfEmpty={v => setField("hideIfEmpty", v)}
        conditions={values.conditions}
        setConditions={v => setField("conditions", v)}
        sort={values.sort}
        setSort={v => setField("sort", v)}
        displayDefaultOpen={!section}
        filterDefaultOpen={(section?.conditions.children.length ?? 0) > 0}
        categories={categories ?? []}
        properties={properties ?? []}
        tagTree={tagTree ?? []}
      />

      <Separator />

      <HomepageSectionPreview
        conditions={values.conditions}
      />

      <Separator />

      <HomepageSectionFormActions
        isAutoSave={isAutoSave}
        canSave={values.title.trim().length > 0}
        onCancel={onCancel}
        isPending={isPending}
        onDelete={onDelete}
        isDeleting={isDeleting}
      />
    </form>
  );
}
