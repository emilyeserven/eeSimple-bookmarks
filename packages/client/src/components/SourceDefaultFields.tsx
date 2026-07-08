import type { ComboboxOption } from "./Combobox";
import type { TreeComboboxOption } from "./TreeMultiCombobox";

import { useId, useState } from "react";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { TreeCombobox } from "./TreeCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

interface SourceDefaultFieldsProps {
  /** Initial selected ids — the component owns the picker display state from here on. */
  initialCategoryId: string | null;
  categoryOptions: ComboboxOption[];
  /** Persist the new default when the picker value changes. */
  onCategoryChange: (id: string | null) => void;
  /** Footer note explaining the auto-apply behavior (copy differs per source). */
  note: string;
  categoryLabel?: string;
  /** Set to `false` to omit the media-type picker entirely (e.g. YouTube channels, which have no
   * default-media-type concept). Defaults to `true`. */
  showMediaType?: boolean;
  initialMediaTypeId?: string | null;
  mediaTypeOptions?: TreeComboboxOption[];
  onMediaTypeChange?: (id: string | null) => void;
  mediaTypeLabel?: string;
}

interface CategoryDefaultFieldProps {
  initialCategoryId: string | null;
  categoryOptions: ComboboxOption[];
  onCategoryChange: (id: string | null) => void;
  categoryLabel?: string;
}

/**
 * The "default category" picker, extracted so it can be placed independently of the media-type
 * picker (e.g. as its own {@link WorkbenchField}). Owns its own picker display state; persists each
 * change via `onCategoryChange`. Exposes an inline "Create…" action that updates the picker display
 * only (matching the original `form.setFieldValue`-on-create behavior, which did not auto-save).
 */
export function CategoryDefaultField({
  initialCategoryId,
  categoryOptions,
  onCategoryChange,
  categoryLabel,
}: CategoryDefaultFieldProps) {
  const {
    t,
  } = useTranslation();
  const categoryFieldId = useId();
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const categoryCreate = useEntityCreateOption("category", category => setCategoryId(category.id));
  const resolvedCategoryLabel = categoryLabel ?? t("Category");

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor={categoryFieldId}>{resolvedCategoryLabel}</Label>
        <Combobox
          id={categoryFieldId}
          aria-label={resolvedCategoryLabel}
          options={categoryOptions}
          value={categoryId || undefined}
          placeholder={t("No category")}
          searchPlaceholder={t("Search categories…")}
          emptyText={t("No categories found.")}
          createOption={categoryCreate.createOption}
          onValueChange={(value) => {
            const id = value || null;
            setCategoryId(id);
            onCategoryChange(id);
          }}
        />
      </div>
      {categoryCreate.modal}
    </>
  );
}

interface MediaTypeDefaultFieldProps {
  initialMediaTypeId?: string | null;
  mediaTypeOptions?: TreeComboboxOption[];
  onMediaTypeChange?: (id: string | null) => void;
  mediaTypeLabel?: string;
}

/**
 * The "default media type" picker, extracted so it can be placed independently of the category
 * picker (e.g. as its own {@link WorkbenchField}). Owns its own picker display state; persists each
 * change via `onMediaTypeChange`. Exposes an inline "Create…" action that updates the picker display
 * only (matching the original `form.setFieldValue`-on-create behavior, which did not auto-save).
 */
export function MediaTypeDefaultField({
  initialMediaTypeId = null,
  mediaTypeOptions = [],
  onMediaTypeChange,
  mediaTypeLabel,
}: MediaTypeDefaultFieldProps) {
  const {
    t,
  } = useTranslation();
  const mediaTypeFieldId = useId();
  const [mediaTypeId, setMediaTypeId] = useState(initialMediaTypeId);
  const mediaTypeCreate = useEntityCreateOption("media-type", mediaType => setMediaTypeId(mediaType.id));
  const resolvedMediaTypeLabel = mediaTypeLabel ?? t("Media type");

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor={mediaTypeFieldId}>{resolvedMediaTypeLabel}</Label>
        <TreeCombobox
          id={mediaTypeFieldId}
          aria-label={resolvedMediaTypeLabel}
          options={mediaTypeOptions}
          value={mediaTypeId || undefined}
          placeholder={t("No media type")}
          searchPlaceholder={t("Search media types…")}
          emptyText={t("No media types found.")}
          createOption={mediaTypeCreate.createOption}
          onValueChange={(value) => {
            const id = value || null;
            setMediaTypeId(id);
            onMediaTypeChange?.(id);
          }}
        />
      </div>
      {mediaTypeCreate.modal}
    </>
  );
}

/**
 * The "default category + default media type" picker pair shared by the source taxonomy general
 * forms (Website / YouTube channel). Recomposed from {@link CategoryDefaultField} and
 * {@link MediaTypeDefaultField} so those callers' output is unchanged (Newsletter places the two
 * halves independently instead — see `NewsletterGeneralForm.tsx`).
 */
export function SourceDefaultFields({
  initialCategoryId,
  categoryOptions,
  onCategoryChange,
  note,
  categoryLabel,
  showMediaType = true,
  initialMediaTypeId = null,
  mediaTypeOptions = [],
  onMediaTypeChange,
  mediaTypeLabel,
}: SourceDefaultFieldsProps) {
  return (
    <>
      <CategoryDefaultField
        initialCategoryId={initialCategoryId}
        categoryOptions={categoryOptions}
        onCategoryChange={onCategoryChange}
        categoryLabel={categoryLabel}
      />
      {showMediaType
        ? (
          <MediaTypeDefaultField
            initialMediaTypeId={initialMediaTypeId}
            mediaTypeOptions={mediaTypeOptions}
            onMediaTypeChange={onMediaTypeChange}
            mediaTypeLabel={mediaTypeLabel}
          />
        )
        : null}
      <p className="text-sm text-muted-foreground">{note}</p>
    </>
  );
}
