import type { HeaderBreadcrumbData } from "./-appHeaderCrumbs";
import type { ToolbarAction } from "@/components/header/toolbarActions";

import { resolveAddChild, resolvePinContext } from "./-appHeaderData";

import { buildToolbarActions } from "@/components/header/toolbarActions";
import { usePanelControls } from "@/components/panel/usePanelControls";
import { findSettingsPage } from "@/lib/settingsPages";
import { useUiStore } from "@/stores/uiStore";

/** Subset of the resolved breadcrumb data the toolbar needs to build its contextual actions. */
type ToolbarBreadcrumbData = Pick<
  HeaderBreadcrumbData,
  "bookmarkId" | "category" | "website" | "mediaType" | "channel" | "currentTag"
>;

/**
 * Builds the right-side header toolbar actions for the current path. Owns the pin / add-child
 * resolution, the settings-page lookup, the panel controls, and the listing/bulk/search `uiStore`
 * selectors, so the `AppHeader` component stays thin and under the complexity cap.
 */
export function useHeaderToolbarActions(
  pathname: string,
  pathParts: string[],
  data: ToolbarBreadcrumbData,
): ToolbarAction[] {
  const {
    bookmarkId, category, website, mediaType, channel, currentTag,
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
  });
  const pinContext = resolvePinContext({
    category,
    website,
    mediaType,
    channel,
    currentTag,
  });

  const {
    open,
  } = usePanelControls();

  const listingPage = useUiStore(state => state.listingPage);
  const bulkSelectPageKey = useUiStore(state => state.bulkSelectPageKey);
  const headerSearchActive = useUiStore(state => state.headerSearchActive);

  // Right-side toolbar controls in canonical left→right order. The builder owns ordering and
  // conditional presence; `HeaderToolbar` renders the inline row on wide screens and collapses
  // everything but the panel toggle into a More menu on small screens.
  return buildToolbarActions({
    pathParts,
    headerSearchActive,
    listingPage,
    bulkSelectPageKey,
    isBookmarkDetail,
    bookmarkId,
    addChild,
    settingsPage,
    pinContext,
    openPanel: open,
  });
}
