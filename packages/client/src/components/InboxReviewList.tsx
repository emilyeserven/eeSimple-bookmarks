import type { useInboxReviewController } from "./useInboxReviewController";

import { useState } from "react";

import { InboxItemsView } from "./InboxItemsView";
import { InboxPreFillBox } from "./InboxPreFillBox";
import { navLinkClass, navStripClass } from "./TabbedShell";

import { cn } from "@/lib/utils";

// Re-exported so existing importers (`routes/inbox.index.tsx`, tests) keep their import site.
export { InboxBulkActions } from "./InboxBulkActions";

/**
 * The Inbox review queue: Pending and Processed sections rendered from a controller that is owned
 * by the parent page (so the page can hoist the controls into its title bar). The split is frozen
 * by snapshot so a processed item doesn't jump sections immediately — "Sort now" re-partitions on
 * demand. Each row's actions are item-scoped, so the list can mix items from different imports.
 * Renders as cards or a sortable table, remembered per page in `uiStore`.
 */
export function InboxReviewList({
  controller,
}: {
  controller: ReturnType<typeof useInboxReviewController>;
}) {
  const {
    viewMode,
    columns,
    pendingItems,
    processedItems,
    dismissItem,
    preFill,
    setPreFill,
    resetPreFill,
  } = controller;

  const [activeTab, setActiveTab] = useState<"pending" | "processed">("pending");

  return (
    <div className="space-y-6">
      <InboxPreFillBox
        preFill={preFill}
        setPreFill={setPreFill}
        onReset={resetPreFill}
      />
      <nav
        className={navStripClass}
        aria-label="Inbox items"
      >
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={cn(navLinkClass, activeTab === "pending" && `
            bg-accent text-accent-foreground
          `)}
        >
          Pending ({pendingItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("processed")}
          className={cn(navLinkClass, activeTab === "processed" && `
            bg-accent text-accent-foreground
          `)}
        >
          Processed ({processedItems.length})
        </button>
      </nav>

      {activeTab === "pending"
        ? (
          <InboxItemsView
            items={pendingItems}
            viewMode={viewMode}
            columns={columns}
            emptyMessage="No pending items."
            onDismiss={dismissItem}
            preFill={preFill}
          />
        )
        : (
          <InboxItemsView
            items={processedItems}
            viewMode={viewMode}
            columns={columns}
            emptyMessage="No processed items."
          />
        )}
    </div>
  );
}
