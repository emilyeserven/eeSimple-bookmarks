import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { useBuiltInName } from "@/lib/builtInName";
import { categoryComboboxOptions, mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

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
  const builtInName = useBuiltInName();

  return {
    categoryOptions: categoryComboboxOptions(categories ?? []),
    mediaTypeOptions: mediaTypeNodesToOptions(mediaTypeTree ?? [], builtInName),
    tagTree: tagTree ?? [],
    youtubeChannels: youtubeChannels ?? [],
  };
}
