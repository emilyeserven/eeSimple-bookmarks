import type { Category, LocationNode, MediaTypeNode, TagNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { NO_CATEGORY, NO_MEDIA_TYPE } from "./AutofillRuleForm";
import { Combobox } from "./Combobox";
import { LocationPickerWithCreate } from "./LocationPickerWithCreate";
import { TagPickerWithCreate } from "./TagPickerWithCreate";
import { TreeCombobox } from "./TreeCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useGatedTagTree } from "../hooks/useGatedTagTree";
import { iconComboboxOptions, mediaTypeNodesToOptions } from "../lib/comboboxOptions";

import { Label } from "@/components/ui/label";

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
  /** The rule's own "Set category" action, resolved to a real id (or `null`) — gates "Apply tags". */
  appliedCategoryId: string | null;
}

/** Category + media-type comboboxes and tag picker for the autofill rule prefill form. */
export function AutofillRulePrefillPickers({
  categories, mediaTypeTree, tagTree, locationTree, setCategoryId, onCategoryChange,
  setMediaTypeId, onMediaTypeChange, tagIds, onToggleTag, locationIds, onToggleLocation,
  appliedCategoryId,
}: Props) {
  const {
    t,
  } = useTranslation();
  const categoryCreate = useEntityCreateOption("category", c => onCategoryChange(c.id));
  const mediaTypeCreate = useEntityCreateOption("media-type", m => onMediaTypeChange(m.id));
  const {
    tree: gatedTagTree,
  } = useGatedTagTree(appliedCategoryId, tagTree);

  const leaveUnchanged = t("— Leave unchanged —");
  const categoryOptions = [
    {
      value: NO_CATEGORY,
      label: leaveUnchanged,
    },
    ...iconComboboxOptions(categories),
  ];

  return (
    <>
      <div className="space-y-1">
        <Label>{t("Set category")}</Label>
        <Combobox
          options={categoryOptions}
          value={setCategoryId}
          onValueChange={v => onCategoryChange(v ?? NO_CATEGORY)}
          searchPlaceholder={t("Search categories…")}
          emptyText={t("No categories found.")}
          createOption={categoryCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label>{t("Set media type")}</Label>
        <TreeCombobox
          options={mediaTypeNodesToOptions(mediaTypeTree)}
          leadingOption={{
            value: NO_MEDIA_TYPE,
            label: leaveUnchanged,
          }}
          value={setMediaTypeId}
          onValueChange={v => onMediaTypeChange(v ?? NO_MEDIA_TYPE)}
          searchPlaceholder={t("Search media types…")}
          emptyText={t("No media types found.")}
          createOption={mediaTypeCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label>{t("Apply tags")}</Label>
        <TagPickerWithCreate
          tree={gatedTagTree}
          selectedIds={tagIds}
          onToggle={onToggleTag}
        />
      </div>

      <div className="space-y-1">
        <Label>{t("Apply locations")}</Label>
        <LocationPickerWithCreate
          tree={locationTree}
          selectedIds={locationIds}
          onToggle={onToggleLocation}
        />
      </div>

      {categoryCreate.modal}
      {mediaTypeCreate.modal}
    </>
  );
}
