import type { Category, LocationNode, MediaTypeNode, TagNode } from "@eesimple/types";

import { NO_CATEGORY, NO_MEDIA_TYPE } from "./AutofillRuleForm";
import { Combobox } from "./Combobox";
import { LocationPickerWithCreate } from "./LocationPickerWithCreate";
import { TagPickerWithCreate } from "./TagPickerWithCreate";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { iconComboboxOptions, mediaTypeTreeComboboxOptions } from "../lib/comboboxOptions";

import { Label } from "@/components/ui/label";

const LEAVE_UNCHANGED = "— Leave unchanged —";

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

/** Category + media-type comboboxes and tag picker for the autofill rule prefill form. */
export function AutofillRulePrefillPickers({
  categories, mediaTypeTree, tagTree, locationTree, setCategoryId, onCategoryChange,
  setMediaTypeId, onMediaTypeChange, tagIds, onToggleTag, locationIds, onToggleLocation,
}: Props) {
  const categoryCreate = useEntityCreateOption("category", c => onCategoryChange(c.id));
  const mediaTypeCreate = useEntityCreateOption("media-type", m => onMediaTypeChange(m.id));

  const categoryOptions = [
    {
      value: NO_CATEGORY,
      label: LEAVE_UNCHANGED,
    },
    ...iconComboboxOptions(categories),
  ];
  const mediaTypeOptions = [
    {
      value: NO_MEDIA_TYPE,
      label: LEAVE_UNCHANGED,
    },
    ...mediaTypeTreeComboboxOptions(mediaTypeTree),
  ];

  return (
    <>
      <div className="space-y-1">
        <Label>Set category</Label>
        <Combobox
          options={categoryOptions}
          value={setCategoryId}
          onValueChange={v => onCategoryChange(v ?? NO_CATEGORY)}
          searchPlaceholder="Search categories…"
          emptyText="No categories found."
          createOption={categoryCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label>Set media type</Label>
        <Combobox
          options={mediaTypeOptions}
          value={setMediaTypeId}
          onValueChange={v => onMediaTypeChange(v ?? NO_MEDIA_TYPE)}
          searchPlaceholder="Search media types…"
          emptyText="No media types found."
          createOption={mediaTypeCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label>Apply tags</Label>
        <TagPickerWithCreate
          tree={tagTree}
          selectedIds={tagIds}
          onToggle={onToggleTag}
        />
      </div>

      <div className="space-y-1">
        <Label>Apply locations</Label>
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
