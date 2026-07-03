import {
  useAddBookmarkImage,
  useAutoBookmarkImage,
  useBookmarkImagesFromCandidates,
  useBookmarkUrlDuplicateCheck,
  useCreateBookmark,
  useDeleteBookmarkImage,
  useDeleteBookmarkImageById,
  useSetMainBookmarkImage,
  useUpdateBookmark,
  useUploadBookmarkImage,
} from "../hooks/useBookmarks";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { useFetchTitle } from "../hooks/useFetchTitle";
import { useCreateGroup } from "../hooks/useGroups";
import { useCreateLanguage } from "../hooks/useLanguages";
import { useAutoPersonImage, useCreatePerson, useUpdatePerson } from "../hooks/usePeople";
import { useUpdateWebsite, useWebsiteLookup } from "../hooks/useWebsites";
import { useUpdateYouTubeChannel } from "../hooks/useYouTubeChannels";

/**
 * Bundles every side-effecting hook the bookmark form drives: the create/update mutations, the three
 * image mutations, the title + metadata fetchers, the website lookup, and the website / YouTube-channel
 * default updates. Co-located so `BookmarkForm` imports one module instead of each action hook. Return
 * shapes are inferred so the form keeps the exact mutation/query objects (`mutateAsync`, `isPending`,
 * `data`, `reset`, …) it already uses.
 */
export function useBookmarkFormActions() {
  return {
    createBookmark: useCreateBookmark(),
    updateBookmark: useUpdateBookmark(),
    uploadImage: useUploadBookmarkImage(),
    autoImage: useAutoBookmarkImage(),
    deleteImage: useDeleteBookmarkImage(),
    addImage: useAddBookmarkImage(),
    imagesFromCandidates: useBookmarkImagesFromCandidates(),
    setMainImage: useSetMainBookmarkImage(),
    deleteImageById: useDeleteBookmarkImageById(),
    fetchTitle: useFetchTitle(),
    fetchMetadata: useFetchMetadata(),
    websiteLookup: useWebsiteLookup(),
    urlDuplicateCheck: useBookmarkUrlDuplicateCheck(),
    updateWebsite: useUpdateWebsite(),
    updateYouTubeChannel: useUpdateYouTubeChannel(),
    createPerson: useCreatePerson(),
    updatePerson: useUpdatePerson(),
    autoPersonImage: useAutoPersonImage(),
    createGroup: useCreateGroup(),
    createLanguage: useCreateLanguage(),
  };
}
