import { TagPicker } from "./TagPicker";
import {
  useCategoryRootTags,
  useSetCategoryRootTags,
} from "../hooks/useCategories";
import { useTagTree } from "../hooks/useTags";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { rootOnly, toggleId } from "../lib/tag-utils";

import { Label } from "@/components/ui/label";

interface CategoryTieredTagsProps {
  categoryId: string;
}

/**
 * Per-category root-tag allowlist: limits which tiered ("parent") tags are offered when
 * tagging a bookmark in this category. An empty selection means every tag is allowed.
 */
export function CategoryTieredTags({
  categoryId,
}: CategoryTieredTagsProps) {
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: rootTagIds,
  } = useCategoryRootTags(categoryId);
  const setRootTags = useSetCategoryRootTags(categoryId);

  const roots = rootOnly(tagTree ?? []);
  const enabledRootTags = rootTagIds ?? [];

  return (
    <div className="space-y-1">
      <Label>Enabled parent tags</Label>
      <p className="text-xs text-muted-foreground">
        Limit which root tags are offered when tagging a bookmark in this category. Leave all
        unchecked to allow every tag.
      </p>
      <TagPicker
        tree={roots}
        selectedIds={enabledRootTags}
        onToggle={id => setRootTags.mutate(toggleId(enabledRootTags, id), {
          onSuccess: () => notifyFieldSaved("Tiered tags"),
          onError: error => notifyFieldSaveError("Tiered tags", describeError(error)),
        })}
      />
    </div>
  );
}
