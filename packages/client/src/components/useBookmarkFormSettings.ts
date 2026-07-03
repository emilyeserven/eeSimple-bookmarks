import {
  useAutoFetchImage,
  useAutoFetchTitle,
  useCustomStripParams,
  useRedirectIgnoreList,
  useShortenerIgnoreList,
} from "../hooks/useAppSettings";
import { useGroups } from "../hooks/useGroups";
import { usePeople } from "../hooks/usePeople";

/**
 * The bookmark form's app-settings flags (shortener / strip-param / redirect ignore lists and the
 * auto-fetch toggles) plus the people/groups lists. Grouped into one hook so `useBookmarkFormData`
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
    data: groups,
  } = useGroups();
  const autoFetchTitle = useAutoFetchTitle();
  const autoFetchImage = useAutoFetchImage();

  return {
    shortenerIgnoreList,
    customStripParams,
    redirectIgnoreList,
    people,
    groups,
    autoFetchTitle,
    autoFetchImage,
  };
}
