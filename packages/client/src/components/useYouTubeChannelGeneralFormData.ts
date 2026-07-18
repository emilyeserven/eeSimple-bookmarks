import { useCategories } from "@/hooks/useCategories";
import { useGroups } from "@/hooks/useGroups";
import { useTagTree } from "@/hooks/useTags";
import { useWebsites } from "@/hooks/useWebsites";
import { categoryComboboxOptions } from "@/lib/comboboxOptions";

/**
 * The taxonomy queries the YouTube-channel General form needs, returned with defaults applied and
 * combobox options pre-mapped. Split out of `useYouTubeChannelGeneralForm` so the controller stays
 * under the import-dependency cap.
 */
export function useYouTubeChannelGeneralFormData() {
  const {
    data: categories,
  } = useCategories();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: groups,
  } = useGroups();

  return {
    categoryOptions: categoryComboboxOptions(categories ?? []),
    tagTree: tagTree ?? [],
    websites: websites ?? [],
    groups: groups ?? [],
  };
}
