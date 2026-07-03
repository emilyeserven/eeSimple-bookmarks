import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { iconComboboxOptions, mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

/**
 * The taxonomy queries the website General form needs, returned with defaults applied and combobox
 * options pre-mapped. Split out of `useWebsiteGeneralForm` so the controller stays under the
 * import-dependency cap.
 */
export function useWebsiteGeneralFormData() {
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
    data: youtubeChannels,
  } = useYouTubeChannels();

  return {
    categoryOptions: iconComboboxOptions(categories ?? []),
    mediaTypeOptions: mediaTypeNodesToOptions(mediaTypeTree ?? []),
    tagTree: tagTree ?? [],
    youtubeChannels: youtubeChannels ?? [],
  };
}
