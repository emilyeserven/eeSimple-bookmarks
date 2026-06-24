import type { Category, MediaType, TagNode } from "@eesimple/types";

import { NO_CATEGORY, NO_MEDIA_TYPE } from "./AutofillRuleForm";
import { TagPickerWithCreate } from "./TagPickerWithCreate";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  categories: Category[];
  mediaTypes: MediaType[];
  tagTree: TagNode[];
  setCategoryId: string;
  onCategoryChange: (value: string) => void;
  setMediaTypeId: string;
  onMediaTypeChange: (value: string) => void;
  tagIds: string[];
  onToggleTag: (id: string) => void;
}

/** Category + media-type selects and tag picker for the autofill rule prefill form. */
export function AutofillRulePrefillPickers({
  categories, mediaTypes, tagTree, setCategoryId, onCategoryChange,
  setMediaTypeId, onMediaTypeChange, tagIds, onToggleTag,
}: Props) {
  return (
    <>
      <div className="space-y-1">
        <Label>Set category</Label>
        <Select
          value={setCategoryId}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CATEGORY}>— Leave unchanged —</SelectItem>
            {categories.map(c => (
              <SelectItem
                key={c.id}
                value={c.id}
              >{c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Set media type</Label>
        <Select
          value={setMediaTypeId}
          onValueChange={onMediaTypeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_MEDIA_TYPE}>— Leave unchanged —</SelectItem>
            {mediaTypes.map(m => (
              <SelectItem
                key={m.id}
                value={m.id}
              >{m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Apply tags</Label>
        <TagPickerWithCreate
          tree={tagTree}
          selectedIds={tagIds}
          onToggle={onToggleTag}
        />
      </div>
    </>
  );
}
