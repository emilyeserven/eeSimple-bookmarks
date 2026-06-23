import { useBookmarkFormActions } from "./useBookmarkFormActions";
import {
  useAutoFetchImage,
  useAutoFetchTitle,
  useShortenerIgnoreList,
} from "../hooks/useAppSettings";
import { useAuthors } from "../hooks/useAuthors";
import { useAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useTagTree } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

/**
 * Loads every read-only query and UI-store flag the bookmark form needs (websites, shortener ignore
 * list, tag tree, custom properties, categories, autofill rules, and the auto-fetch toggles), plus
 * the side-effecting `actions` bundle (`useBookmarkFormActions`). Pure data plumbing — co-located so
 * `BookmarkForm` imports one hook instead of each query/action hook individually. Return shapes are
 * inferred from the underlying hooks so they stay in lockstep with the API types.
 */
export function useBookmarkFormData() {
  const actions = useBookmarkFormActions();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: shortenerIgnoreList,
  } = useShortenerIgnoreList();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: customProperties,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: autofillRules,
  } = useAutofillRules();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();
  const {
    data: authors,
  } = useAuthors();
  const autoFetchTitle = useAutoFetchTitle();
  const autoFetchImage = useAutoFetchImage();

  return {
    actions,
    websites,
    shortenerIgnoreList,
    tagTree,
    customProperties,
    categories,
    mediaTypes,
    autofillRules,
    youtubeChannels,
    authors,
    autoFetchTitle,
    autoFetchImage,
  };
}
