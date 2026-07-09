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
import { findSettingsPage } from "@/lib/settingsPages";

/**
 * Owns the command palette's data/context wiring: the bookmark list, the hovered/URL bookmark's
 * taxonomy context, the display-preference settings (plus a `setDetailLayout` helper), the listing /
 * saved-filter page contexts. Bundling these here keeps `CommandPalette`'s import surface small.
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

  const setDetailLayout = (layout: "single" | "tabbed") => {
    if (displayPrefs) {
      updateDisplayPrefs.mutate({
        input: {
          ...displayPrefs,
          bookmarkDetailLayout: layout,
        },
        successMessage: `Detail layout: ${layout}`,
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
  };
}
