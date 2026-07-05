import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import {
  bookmarkLayoutAction,
  editBookmarkAction,
  editTaxonomyAction,
  viewDetailsAction,
} from "./toolbarBookmarkActions";
import {
  addChildAction,
  createListingAction,
  homepageSettingsAction,
  openPanelAction,
  pinAction,
  settingsFavoriteAction,
} from "./toolbarEntityActions";
import {
  bulkSelectAction,
  displayOptionsAction,
  filterLocationAction,
  sortAction,
} from "./toolbarListingActions";
import { syncFromSourceAction } from "./toolbarSyncAction";

export type { ToolbarAction, ToolbarContext, ToolbarMobile } from "./toolbarActionTypes";

/**
 * The canonical, ordered header toolbar actions (left → right). The array order is the single source
 * of button order, applied identically to the desktop row and the small-screen More menu. Only
 * present ones render; the panel toggle is always last (the rightmost control).
 */
export function buildToolbarActions(ctx: ToolbarContext): ToolbarAction[] {
  return [
    filterLocationAction(ctx),
    displayOptionsAction(ctx),
    sortAction(ctx),
    bulkSelectAction(ctx),
    bookmarkLayoutAction(ctx),
    viewDetailsAction(ctx),
    editTaxonomyAction(ctx),
    editBookmarkAction(ctx),
    syncFromSourceAction(ctx),
    addChildAction(ctx),
    createListingAction(ctx),
    settingsFavoriteAction(ctx),
    pinAction(ctx),
    homepageSettingsAction(ctx),
    openPanelAction(ctx),
  ].filter((action): action is ToolbarAction => action !== null);
}
