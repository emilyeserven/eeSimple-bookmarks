import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { ViewModeToggle } from "../components/DisplayControlPrimitives";
import { InboxBulkActions, InboxReviewList } from "../components/InboxReviewList";
import { useInboxReviewController } from "../components/useInboxReviewController";
import { useInboxItems } from "../hooks/useImports";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/inbox/")({
  component: InboxPage,
});

function InboxPage() {
  const {
    data: items, isLoading, error, isFetching,
  } = useInboxItems();
  const setAddImportModalOpen = useUiStore(s => s.setAddImportModalOpen);
  const controller = useInboxReviewController(items ?? [], isFetching ?? false);
  const hasItems = items && items.length > 0;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <div className="flex flex-wrap items-center gap-2">
            {hasItems
              ? (
                <>
                  <ViewModeToggle
                    value={controller.viewMode}
                    onChange={mode => controller.setViewMode("inbox", mode)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={controller.resortNow}
                  >
                    Sort now
                  </Button>
                  <InboxBulkActions {...controller} />
                </>
              )
              : null}
            <Button
              className="shrink-0"
              onClick={() => setAddImportModalOpen(true)}
            >
              <Plus className="size-4" />
              Add import
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Review imported links. Approve to save a bookmark (the import item is then marked for
          deletion), reject, or block. Approve, edit, or reject each link; duplicates are flagged
          automatically.
        </p>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">Couldn&apos;t load the inbox.</p> : null}
      {items && items.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            Your inbox is empty. Use &ldquo;Add import&rdquo; to import links.
          </p>
        )
        : null}
      {hasItems
        ? (
          <InboxReviewList controller={controller} />
        )
        : null}
    </section>
  );
}
