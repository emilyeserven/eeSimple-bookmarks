import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { useWebsites } from "@/hooks/useWebsites";
import { iconComboboxOptions, mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

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
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: websites,
  } = useWebsites();

  return {
    categoryOptions: iconComboboxOptions(categories ?? []),
    mediaTypeOptions: mediaTypeNodesToOptions(mediaTypeTree ?? []),
    tagTree: tagTree ?? [],
    websites: websites ?? [],
  };
}
