import type { ReviewFilter } from "./inboxReviewFilter";
import type { InboxItem } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useInboxColumns } from "./tables/inboxColumns";
import { useCategories } from "../hooks/useCategories";
import {
  useApproveImportItem,
  useDeleteRejectedItems,
  useRecheckPendingItems,
  useRejectPendingItems,
} from "../hooks/useImports";
import { useViewMode } from "../lib/bookmarkColumns";
import { notifyError, notifySuccess } from "../lib/notifications";

import { useUiStore } from "@/stores/uiStore";

/**
 * Owns every piece of state, mutation, derivation, and handler the Inbox review list needs, so the
 * `InboxReviewList` component itself stays a thin JSX shell. Spreading the hooks out here keeps the
 * component below fallow's hook-density complexity cap (see CLAUDE.md → Large-form decomposition).
 */
export function useInboxReviewController(items: InboxItem[]) {
  const approve = useApproveImportItem();
  const rejectPending = useRejectPendingItems();
  const recheckPending = useRecheckPendingItems();
  const deleteRejected = useDeleteRejectedItems();
  const {
    data: categories = [],
  } = useCategories();
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [bulkRunning, setBulkRunning] = useState(false);
  const [editingItem, setEditingItem] = useState<InboxItem | null>(null);

  const viewMode = useViewMode("inbox");
  const setViewMode = useUiStore(state => state.setViewMode);
  const columns = useInboxColumns(categories, setEditingItem);

  const pendingCount = useMemo(() => items.filter(i => i.status === "pending").length, [items]);
  const rejectedCount = useMemo(() => items.filter(i => i.status === "rejected").length, [items]);
  const filtered = useMemo(() => items.filter((item) => {
    if (filter === "pending") return item.status === "pending";
    if (filter === "issues") return item.status === "error" || item.status === "duplicate";
    return true;
  }), [items, filter]);

  async function onApproveAll() {
    // Sequential: createBookmark auto-creates websites, so concurrent approvals could race on a host.
    setBulkRunning(true);
    let added = 0;
    for (const item of items.filter(i => i.status === "pending")) {
      try {
        const result = await approve.mutateAsync(item.id);
        if (result.status === "approved") added += 1;
      }
      catch {
        // Keep going; per-item failures are surfaced on their rows after the list refreshes.
      }
    }
    setBulkRunning(false);
    notifySuccess(`Added ${added} bookmark${added === 1 ? "" : "s"}`);
  }

  function onRejectAll() {
    rejectPending.mutate(undefined, {
      onSuccess: ({
        rejected,
      }) => notifySuccess(`Rejected ${rejected} item${rejected === 1 ? "" : "s"}`),
      onError: () => notifyError("Couldn't reject the pending items."),
    });
  }

  function onRecheckBlocklist() {
    recheckPending.mutate(undefined, {
      onSuccess: ({
        blocked,
      }) => notifySuccess(
        blocked === 0
          ? "No pending items matched the block list."
          : `Blocked ${blocked} item${blocked === 1 ? "" : "s"} from the block list.`,
      ),
      onError: () => notifyError("Couldn't recheck the pending items."),
    });
  }

  function onDeleteRejected() {
    deleteRejected.mutate(undefined, {
      onSuccess: ({
        deleted,
      }) => notifySuccess(`Deleted ${deleted} rejected item${deleted === 1 ? "" : "s"}`),
      onError: () => notifyError("Couldn't delete the rejected items."),
    });
  }

  return {
    filter,
    setFilter,
    viewMode,
    setViewMode,
    columns,
    pendingCount,
    rejectedCount,
    filtered,
    editingItem,
    setEditingItem,
    bulkRunning,
    rejectPendingIsPending: rejectPending.isPending,
    recheckPendingIsPending: recheckPending.isPending,
    deleteRejectedIsPending: deleteRejected.isPending,
    onApproveAll,
    onRejectAll,
    onRecheckBlocklist,
    onDeleteRejected,
  };
}
