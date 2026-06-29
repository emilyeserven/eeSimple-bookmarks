import type { Category, LocationNode, MediaTypeNode, TagNode } from "@eesimple/types";

import { useState } from "react";

import { AddCategoryModal } from "./AddCategoryModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { NO_CATEGORY, NO_MEDIA_TYPE } from "./AutofillRuleForm";
import { Combobox } from "./Combobox";
import { LocationPickerWithCreate } from "./LocationPickerWithCreate";
import { TagPickerWithCreate } from "./TagPickerWithCreate";
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
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addMediaTypeOpen, setAddMediaTypeOpen] = useState(false);

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
          createOption={{
            label: "Create category",
            onSelect: () => setAddCategoryOpen(true),
          }}
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
          createOption={{
            label: "Create media type",
            onSelect: () => setAddMediaTypeOpen(true),
          }}
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

      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={c => onCategoryChange(c.id)}
      />
      <AddMediaTypeModal
        open={addMediaTypeOpen}
        onOpenChange={setAddMediaTypeOpen}
        onCreated={m => onMediaTypeChange(m.id)}
      />
    </>
  );
}
