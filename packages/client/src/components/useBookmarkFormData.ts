import { useBookmarkFormActions } from "./useBookmarkFormActions";
import { useBookmarkFormSettings } from "./useBookmarkFormSettings";
import { useAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useLanguages } from "../hooks/useLanguages";
import { useLanguageUsageLevels } from "../hooks/useLanguageUsageLevels";
import { useLocationTree } from "../hooks/useLocations";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
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
    data: tagTree,
  } = useTagTree();
  const {
    data: locationTree,
  } = useLocationTree();
  const {
    data: customProperties,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypes,
  } = useMediaTypeTree();
  const {
    data: languages,
  } = useLanguages();
  const {
    data: availabilityLanguageLevels,
  } = useLanguageUsageLevels("availability");
  const {
    data: autofillRules,
  } = useAutofillRules();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();
  const {
    shortenerIgnoreList,
    customStripParams,
    redirectIgnoreList,
    people,
    groups,
    autoFetchTitle,
    autoFetchImage,
  } = useBookmarkFormSettings();

  return {
    actions,
    websites,
    shortenerIgnoreList,
    customStripParams,
    redirectIgnoreList,
    tagTree,
    locationTree,
    customProperties,
    categories,
    mediaTypes,
    languages,
    availabilityLanguageLevels,
    autofillRules,
    youtubeChannels,
    people,
    groups,
    autoFetchTitle,
    autoFetchImage,
  };
}
