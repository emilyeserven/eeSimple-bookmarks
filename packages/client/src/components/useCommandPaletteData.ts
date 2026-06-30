import { useBookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";
import { useListingPageContext } from "./useListingPageContext";
import { useSavedFilterContext } from "./useSavedFilterContext";

import {
  useBookmarkDetailLayout,
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "@/hooks/useAppSettings";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMatchingCardDisplayRules } from "@/lib/cardDisplayRules";
import { notifyError, notifySuccess } from "@/lib/notifications";

/**
 * Owns the command palette's data/context wiring: the bookmark list, the hovered/URL bookmark's
 * taxonomy context, the display-preference settings (plus a `setDetailLayout` helper), the listing /
 * saved-filter page contexts, and the card display rules matching the active bookmark. Bundling these
 * here keeps `CommandPalette`'s import surface small.
 */
export function useCommandPaletteData(open: boolean, targetBookmarkId: string | null) {
  const {
    data: bookmarks = [],
  } = useBookmarks();

  const taxonomyContext = useBookmarkTaxonomyContext(open ? targetBookmarkId : null);

  const detailLayout = useBookmarkDetailLayout();
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const updateDisplayPrefs = useUpdateDisplayPreferenceSettings();

  const listingCtx = useListingPageContext();
  const savedFilterCtx = useSavedFilterContext();

  // Empty (no bookmark / no matches) renders nothing — CardDisplayRulesGroup returns null — so no
  // extra guard is needed at the call sites beyond the hover/detail position check.
  const matchingCardRules = useMatchingCardDisplayRules(open ? taxonomyContext.bookmark : undefined);

  const setDetailLayout = (layout: "single" | "tabbed") => {
    if (displayPrefs) {
      updateDisplayPrefs.mutate({
        ...displayPrefs,
        bookmarkDetailLayout: layout,
      }, {
        onSuccess: () => notifySuccess(`Detail layout: ${layout}`),
        onError: error => notifyError(error.message),
      });
    }
  };

  return {
    bookmarks,
    taxonomyContext,
    detailLayout,
    setDetailLayout,
    listingCtx,
    savedFilterCtx,
    matchingCardRules,
  };
}
