import type { Category, TagNode } from "@eesimple/types";

import { NO_CATEGORY } from "./AutofillRuleForm";
import { TagPicker } from "./TagPicker";

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
  tagTree: TagNode[];
  setCategoryId: string;
  onCategoryChange: (value: string) => void;
  tagIds: string[];
  onToggleTag: (id: string) => void;
}

/** Category select + tag picker for the autofill rule prefill form. */
export function AutofillRulePrefillPickers({
  categories, tagTree, setCategoryId, onCategoryChange, tagIds, onToggleTag,
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
        <Label>Apply tags</Label>
        <div className="rounded-md border p-2">
          <TagPicker
            tree={tagTree}
            selectedIds={tagIds}
            onToggle={onToggleTag}
          />
        </div>
      </div>
    </>
  );
}
