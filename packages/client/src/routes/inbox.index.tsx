import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { InboxReviewList } from "../components/InboxReviewList";
import { useInboxItems } from "../hooks/useImports";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/inbox/")({
  component: InboxPage,
});

function InboxPage() {
  const {
    data: items, isLoading, error,
  } = useInboxItems();
  const setAddImportModalOpen = useUiStore(s => s.setAddImportModalOpen);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Review imported links. Approve to save a bookmark (the import item is then marked for
            deletion), reject, or block. Approve, edit, or reject each link; duplicates are flagged
            automatically.
          </p>
        </div>
        <Button onClick={() => setAddImportModalOpen(true)}>
          <Plus className="size-4" />
          Add import
        </Button>
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
      {items && items.length > 0 ? <InboxReviewList items={items} /> : null}
    </section>
  );
}
