import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { RefreshCw } from "lucide-react";

import { SyncActionButton } from "./SyncActionButton";

import { SyncFromSourceModal } from "@/components/SyncFromSourceModal";

/**
 * Header action that lets the user re-pull an entity's fields from its outside source. Present only
 * while a mounted edit form has registered a {@link SyncProvider} (`ctx.syncProvider`), so it shows on
 * the bookmark / location / image-taxonomy edit surfaces and nowhere else.
 */
export function syncFromSourceAction(ctx: ToolbarContext): ToolbarAction | null {
  const provider = ctx.syncProvider;
  if (!provider) return null;
  return {
    key: "sync-from-source",
    desktop: <SyncActionButton provider={provider} />,
    mobile: {
      kind: "modal",
      icon: RefreshCw,
      label: "Sync from source",
      renderModal: (open, onOpenChange) => (
        <SyncFromSourceModal
          provider={provider}
          open={open}
          onOpenChange={onOpenChange}
        />
      ),
    },
  };
}
