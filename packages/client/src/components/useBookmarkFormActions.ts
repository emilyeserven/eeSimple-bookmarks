import {
  useAutoBookmarkImage,
  useCreateBookmark,
  useDeleteBookmarkImage,
  useUpdateBookmark,
  useUploadBookmarkImage,
} from "../hooks/useBookmarks";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { useFetchTitle } from "../hooks/useFetchTitle";
import { useWebsiteLookup } from "../hooks/useWebsites";

/**
 * Bundles every side-effecting hook the bookmark form drives: the create/update mutations, the three
 * image mutations, the title + metadata fetchers, and the website lookup. Co-located so `BookmarkForm`
 * imports one module instead of each action hook. Return shapes are inferred so the form keeps the
 * exact mutation/query objects (`mutateAsync`, `isPending`, `data`, `reset`, …) it already uses.
 */
export function useBookmarkFormActions() {
  return {
    createBookmark: useCreateBookmark(),
    updateBookmark: useUpdateBookmark(),
    uploadImage: useUploadBookmarkImage(),
    autoImage: useAutoBookmarkImage(),
    deleteImage: useDeleteBookmarkImage(),
    fetchTitle: useFetchTitle(),
    fetchMetadata: useFetchMetadata(),
    websiteLookup: useWebsiteLookup(),
  };
}
