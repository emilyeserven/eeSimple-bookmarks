import type { Category, LocationNode, MediaTypeNode, TagNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { NO_CATEGORY, NO_MEDIA_TYPE } from "./AutofillRuleForm";
import { Combobox } from "./Combobox";
import { LocationPickerWithCreate } from "./LocationPickerWithCreate";
import { TagPickerWithCreate } from "./TagPickerWithCreate";
import { TreeCombobox } from "./TreeCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useBuiltInName } from "../lib/builtInName";
import { iconComboboxOptions, mediaTypeNodesToOptions } from "../lib/comboboxOptions";
import { sortFavoritesFirst } from "../lib/favoritesOrder";

import { Label } from "@/components/ui/label";

/** "Set category" combobox (with inline create) for the autofill rule prefill form. */
export function AutofillCategoryPicker({
  categories, value, onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  const categoryCreate = useEntityCreateOption("category", c => onChange(c.id));

  const categoryOptions = [
    {
      value: NO_CATEGORY,
      label: t("— Leave unchanged —"),
    },
    ...iconComboboxOptions(sortFavoritesFirst(categories)),
  ];

  return (
    <div className="space-y-1">
      <Label>{t("Set category")}</Label>
      <Combobox
        options={categoryOptions}
        value={value}
        onValueChange={v => onChange(v ?? NO_CATEGORY)}
        searchPlaceholder={t("Search categories…")}
        emptyText={t("No categories found.")}
        createOption={categoryCreate.createOption}
      />
      {categoryCreate.modal}
    </div>
  );
}

/** "Set media type" combobox (with inline create) for the autofill rule prefill form. */
export function AutofillMediaTypePicker({
  mediaTypeTree, value, onChange,
}: {
  mediaTypeTree: MediaTypeNode[];
  value: string;
  onChange: (value: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  const builtInName = useBuiltInName();
  const mediaTypeCreate = useEntityCreateOption("media-type", m => onChange(m.id));

  return (
    <div className="space-y-1">
      <Label>{t("Set media type")}</Label>
      <TreeCombobox
        options={mediaTypeNodesToOptions(mediaTypeTree, builtInName)}
        leadingOption={{
          value: NO_MEDIA_TYPE,
          label: t("— Leave unchanged —"),
        }}
        value={value}
        onValueChange={v => onChange(v ?? NO_MEDIA_TYPE)}
        searchPlaceholder={t("Search media types…")}
        emptyText={t("No media types found.")}
        createOption={mediaTypeCreate.createOption}
      />
      {mediaTypeCreate.modal}
    </div>
  );
}

/** "Apply tags" picker (with inline create) for the autofill rule prefill form. */
export function AutofillTagsPicker({
  tagTree, selectedIds, onToggle,
}: {
  tagTree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Apply tags")}</Label>
      <TagPickerWithCreate
        tree={tagTree}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}

/** "Apply locations" picker (with inline create) for the autofill rule prefill form. */
export function AutofillLocationsPicker({
  locationTree, selectedIds, onToggle,
}: {
  locationTree: LocationNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Apply locations")}</Label>
      <LocationPickerWithCreate
        tree={locationTree}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}

interface Props {
  categories: Category[];
  mediaTypeTree: MediaTypeNode[];
  tagTree: TagNode[];
  locationTree: LocationNode[];
  setCategoryId: string;
  onCategoryChange: (value: string) => void;
  setMediaTypeId: string;
  onMediaTypeChange: (value: string) => void;
  tagIds: string[];
  onToggleTag: (id: string) => void;
  locationIds: string[];
  onToggleLocation: (id: string) => void;
}

/**
 * Category + media-type comboboxes and tag/location pickers for the autofill rule prefill form.
 * Recomposed from the four independently-placeable halves above (`AutofillCategoryPicker`, …) so
 * its prop-driven consumers/story stay unchanged while each half can be surfaced on its own layout
 * field — the #1197 prefill split, mirroring the newsletter `SourceDefaultFields` recomposition.
 */
export function AutofillRulePrefillPickers({
  categories, mediaTypeTree, tagTree, locationTree, setCategoryId, onCategoryChange,
  setMediaTypeId, onMediaTypeChange, tagIds, onToggleTag, locationIds, onToggleLocation,
}: Props) {
  return (
    <>
      <AutofillCategoryPicker
        categories={categories}
        value={setCategoryId}
        onChange={onCategoryChange}
      />
      <AutofillMediaTypePicker
        mediaTypeTree={mediaTypeTree}
        value={setMediaTypeId}
        onChange={onMediaTypeChange}
      />
      <AutofillTagsPicker
        tagTree={tagTree}
        selectedIds={tagIds}
        onToggle={onToggleTag}
      />
      <AutofillLocationsPicker
        locationTree={locationTree}
        selectedIds={locationIds}
        onToggle={onToggleLocation}
      />
    </>
  );
}
