import {
  useAutoFetchImage,
  useAutoFetchTitle,
  useCustomStripParams,
  useRedirectIgnoreList,
  useShortenerIgnoreList,
} from "../hooks/useAppSettings";
import { usePeople } from "../hooks/usePeople";
import { usePublishers } from "../hooks/usePublishers";

/**
 * The bookmark form's app-settings flags (shortener / strip-param / redirect ignore lists and the
 * auto-fetch toggles) plus the people/publishers lists. Grouped into one hook so `useBookmarkFormData`
 * stays under the per-file import cap; these are all read-only, side-effect-free queries/flags.
 */
export function useBookmarkFormSettings() {
  const {
    data: shortenerIgnoreList,
  } = useShortenerIgnoreList();
  const {
    data: customStripParams,
  } = useCustomStripParams();
  const {
    data: redirectIgnoreList,
  } = useRedirectIgnoreList();
  const {
    data: people,
  } = usePeople();
  const {
    data: publishers,
  } = usePublishers();
  const autoFetchTitle = useAutoFetchTitle();
  const autoFetchImage = useAutoFetchImage();

  return {
    shortenerIgnoreList,
    customStripParams,
    redirectIgnoreList,
    people,
    publishers,
    autoFetchTitle,
    autoFetchImage,
  };
}
