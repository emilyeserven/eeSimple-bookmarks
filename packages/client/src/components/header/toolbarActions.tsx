import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import {
  bookmarkLayoutAction,
  editBookmarkAction,
  editTaxonomyAction,
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
    displayOptionsAction(ctx),
    bulkSelectAction(ctx),
    bookmarkLayoutAction(ctx),
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
