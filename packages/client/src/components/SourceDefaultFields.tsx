import type { ComboboxOption } from "./Combobox";

import { useId, useState } from "react";

import { Combobox } from "./Combobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

interface SourceDefaultFieldsProps {
  /** Initial selected ids — the component owns the picker display state from here on. */
  initialCategoryId: string | null;
  initialMediaTypeId: string | null;
  categoryOptions: ComboboxOption[];
  mediaTypeOptions: ComboboxOption[];
  /** Persist the new default when the picker value changes. */
  onCategoryChange: (id: string | null) => void;
  onMediaTypeChange: (id: string | null) => void;
  /** Footer note explaining the auto-apply behavior (copy differs per source). */
  note: string;
  categoryLabel?: string;
  mediaTypeLabel?: string;
}

/**
 * The "default category + default media type" picker pair shared by the source taxonomy general
 * forms (Website / YouTube channel / Newsletter). It owns the picker display state internally — so a
 * parent form adds no extra hooks — persisting each change via its `on*Change` callback. Each picker
 * exposes an inline "Create…" action; inline-create updates the picker display only (matching the
 * original `form.setFieldValue`-on-create behavior, which did not auto-save).
 */
export function SourceDefaultFields({
  initialCategoryId,
  initialMediaTypeId,
  categoryOptions,
  mediaTypeOptions,
  onCategoryChange,
  onMediaTypeChange,
  note,
  categoryLabel = "Category",
  mediaTypeLabel = "Media type",
}: SourceDefaultFieldsProps) {
  const categoryFieldId = useId();
  const mediaTypeFieldId = useId();
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [mediaTypeId, setMediaTypeId] = useState(initialMediaTypeId);
  const categoryCreate = useEntityCreateOption("category", category => setCategoryId(category.id));
  const mediaTypeCreate = useEntityCreateOption("media-type", mediaType => setMediaTypeId(mediaType.id));

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor={categoryFieldId}>{categoryLabel}</Label>
        <Combobox
          id={categoryFieldId}
          aria-label={categoryLabel}
          options={categoryOptions}
          value={categoryId || undefined}
          placeholder="No category"
          searchPlaceholder="Search categories…"
          emptyText="No categories found."
          createOption={categoryCreate.createOption}
          onValueChange={(value) => {
            const id = value || null;
            setCategoryId(id);
            onCategoryChange(id);
          }}
        />
      </div>
      {categoryCreate.modal}

      <div className="space-y-1">
        <Label htmlFor={mediaTypeFieldId}>{mediaTypeLabel}</Label>
        <Combobox
          id={mediaTypeFieldId}
          aria-label={mediaTypeLabel}
          options={mediaTypeOptions}
          value={mediaTypeId || undefined}
          placeholder="No media type"
          searchPlaceholder="Search media types…"
          emptyText="No media types found."
          createOption={mediaTypeCreate.createOption}
          onValueChange={(value) => {
            const id = value || null;
            setMediaTypeId(id);
            onMediaTypeChange(id);
          }}
        />
      </div>
      {mediaTypeCreate.modal}
      <p className="text-sm text-muted-foreground">{note}</p>
    </>
  );
}
