import { useRouterState } from "@tanstack/react-router";

import { useBookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";
import { useEntityCommandContext } from "./useEntityCommandContext";
import { useListingPageContext } from "./useListingPageContext";

import {
  useBookmarkDetailLayout,
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "@/hooks/useAppSettings";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMatchingCardDisplayRules } from "@/lib/cardDisplayRules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { findSettingsPage } from "@/lib/settingsPages";

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

  // The slug-routed entity behind the current page (registry-driven; list query gated on `open`).
  const entityCtx = useEntityCommandContext(open);

  // The favoritable settings page for the current pathname (mirrors the header star button).
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const settingsPage = findSettingsPage(pathname) ?? null;

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
    entityCtx,
    settingsPage,
    matchingCardRules,
  };
}
