import type { HeaderBreadcrumbData } from "./-appHeaderCrumbs";
import type { ToolbarAction } from "@/components/header/toolbarActions";

import { resolveAddChild, resolvePinContext } from "./-appHeaderData";

import { buildToolbarActions } from "@/components/header/toolbarActions";
import { useHeaderFavoriteContext } from "@/hooks/useHeaderFavoriteContext";
import { findSettingsPage } from "@/lib/settingsPages";
import { useUiStore } from "@/stores/uiStore";

/** Subset of the resolved breadcrumb data the toolbar needs to build its contextual actions. */
type ToolbarBreadcrumbData = Pick<
  HeaderBreadcrumbData,
  "bookmarkId" | "category" | "website" | "mediaType" | "channel" | "currentTag" | "customTaxonomyTerm"
>;

/**
 * Builds the right-side header toolbar actions for the current path. Owns the pin / add-child
 * resolution, the settings-page lookup, and the listing/bulk `uiStore` selectors, so the
 * `AppHeader` component stays thin and under the complexity cap.
 */
export function useHeaderToolbarActions(
  pathname: string,
  pathParts: string[],
  data: ToolbarBreadcrumbData,
): ToolbarAction[] {
  const {
    bookmarkId, category, website, mediaType, channel, currentTag, customTaxonomyTerm,
  } = data;

  // Show Edit button in the header only on the bookmark detail page (not edit pages)
  const isBookmarkDetail = Boolean(bookmarkId)
    && !pathname.includes("/edit")
    && pathname.startsWith("/bookmarks/");

  // Settings (and settings-like management) pages get a header star to favorite the current page.
  const settingsPage = findSettingsPage(pathname);

  const addChild = resolveAddChild({
    pathParts,
    tagParentId: currentTag?.id,
    mediaTypeId: mediaType?.id,
    customTaxonomyTerm,
  });
  const pinContext = resolvePinContext({
    category,
    website,
    mediaType,
    channel,
    currentTag,
  });
  // The header star is resolved generically from the route (all favoritable kinds), not per-entity.
  const favoriteContext = useHeaderFavoriteContext(pathname);

  const listingPage = useUiStore(state => state.listingPage);
  const syncProvider = useUiStore(state => state.syncProvider);

  // Right-side toolbar controls in canonical left→right order. The builder owns ordering and
  // conditional presence; `HeaderToolbar` renders the inline row on wide screens and collapses
  // everything into a More menu on small screens.
  return buildToolbarActions({
    pathParts,
    listingPage,
    isBookmarkDetail,
    bookmarkId,
    addChild,
    settingsPage,
    pinContext,
    favoriteContext,
    syncProvider,
  });
}
