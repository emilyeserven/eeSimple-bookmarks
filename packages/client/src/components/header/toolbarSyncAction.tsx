import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { SyncActionButton, SyncActionMenuItem } from "./SyncActionButton";

/**
 * Header action that lets the user re-pull an entity's fields from its outside source. Present only
 * while a mounted edit form has registered a {@link SyncProvider} (`ctx.syncProvider`), so it shows on
 * the bookmark / location / image-taxonomy edit surfaces and nowhere else. Both surfaces open the one
 * store-driven {@link AppSyncModal} instance.
 */
export function syncFromSourceAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.syncProvider) return null;
  return {
    key: "sync-from-source",
    desktop: <SyncActionButton />,
    mobile: {
      kind: "menuItem",
      node: <SyncActionMenuItem />,
    },
  };
}
