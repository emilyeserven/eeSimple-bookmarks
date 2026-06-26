import type { OrphanDeleteResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";

import { useState } from "react";

import {
  useDeleteOrphanBookmarks,
  useDeleteOrphanInboxItems,
  useOrphanCounts,
} from "../hooks/useMaintenance";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OrphanKind = "bookmarks" | "inboxItems";

/** One orphan-cleanup row: a label, the live count, and a destructive button that opens the dialog. */
function OrphanRow({
  title,
  description,
  count,
  noun,
  onDelete,
}: {
  title: string;
  description: string;
  count: number;
  noun: string;
  onDelete: () => void;
}) {
  return (
    <div
      className="
        flex flex-col gap-2
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        variant="destructive"
        disabled={count === 0}
        onClick={onDelete}
        className="shrink-0"
      >
        {count === 0 ? `No ${noun}` : `Delete ${count} ${noun}`}
      </Button>
    </div>
  );
}

/**
 * Advanced housekeeping: report and sweep orphaned records — bookmarks with no category and inbox
 * items whose import has no newsletter. Each delete confirms via a dialog showing the count and fires
 * a recorded toast (mirroring the Gallery orphan cleanup).
 */
export function OrphanCleanupCard() {
  const {
    data, isLoading,
  } = useOrphanCounts();
  const deleteBookmarks = useDeleteOrphanBookmarks();
  const deleteInboxItems = useDeleteOrphanInboxItems();
  // Which delete the confirmation dialog is currently asking about (null = closed).
  const [pending, setPending] = useState<OrphanKind | null>(null);

  const bookmarkCount = data?.bookmarks ?? 0;
  const inboxCount = data?.inboxItems ?? 0;

  const config: Record<OrphanKind, {
    count: number;
    noun: string;
    mutation: UseMutationResult<OrphanDeleteResult, Error, void>;
  }> = {
    bookmarks: {
      count: bookmarkCount,
      noun: "bookmarks",
      mutation: deleteBookmarks,
    },
    inboxItems: {
      count: inboxCount,
      noun: "inbox items",
      mutation: deleteInboxItems,
    },
  };

  const active = pending ? config[pending] : null;

  function onConfirm(): void {
    if (!active) return;
    const {
      noun, mutation,
    } = active;
    mutation.mutate(undefined, {
      onSuccess: ({
        deleted,
      }) => {
        notifySuccess(`Deleted ${deleted} orphaned ${noun}`);
        setPending(null);
      },
      onError: error => notifyError(error.message),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clean up orphaned items</CardTitle>
        <CardDescription>
          Permanently delete records that have lost their parent. This can&apos;t be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : (
            <>
              <OrphanRow
                title="Bookmarks without a category"
                description="Bookmarks whose category was removed and never reassigned."
                count={bookmarkCount}
                noun="bookmarks"
                onDelete={() => setPending("bookmarks")}
              />
              <OrphanRow
                title="Inbox items without a newsletter"
                description="Inbox items from newsletter imports whose newsletter was deleted. Extension quick-saves are excluded. Created bookmarks are kept."
                count={inboxCount}
                noun="inbox items"
                onDelete={() => setPending("inboxItems")}
              />
            </>
          )}
      </CardContent>

      <Dialog
        open={pending !== null}
        onOpenChange={open => !open && setPending(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete orphaned items?</DialogTitle>
            <DialogDescription>
              {active
                ? `This permanently deletes ${active.count} ${active.noun}. This can't be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={active?.mutation.isPending}
              onClick={onConfirm}
            >
              {active?.mutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
