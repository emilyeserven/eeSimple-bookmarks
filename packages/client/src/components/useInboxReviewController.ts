import type { InboxItem } from "@eesimple/types";

import {
  useEffect, useMemo, useRef, useState,
} from "react";

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
  const [bulkRunning, setBulkRunning] = useState(false);
  const [editingItem, setEditingItem] = useState<InboxItem | null>(null);

  const viewMode = useViewMode("inbox");
  const setViewMode = useUiStore(state => state.setViewMode);
  const columns = useInboxColumns(categories, setEditingItem);

  const pendingCount = useMemo(() => items.filter(i => i.status === "pending").length, [items]);
  const rejectedCount = useMemo(() => items.filter(i => i.status === "rejected").length, [items]);

  // The Pending/Processed split is *frozen by snapshot*, not derived live from status: an item keeps
  // its section even after it's approved/rejected so it doesn't jump out from under the user. Each
  // item is classified once (the first time it's seen); a still-pending newcomer joins Pending, and
  // "Sort now" re-snapshots everything to the current statuses.
  const classifiedRef = useRef<Set<string>>(new Set());
  const [pendingSectionIds, setPendingSectionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newlyPending: string[] = [];
    for (const item of items) {
      if (classifiedRef.current.has(item.id)) continue;
      classifiedRef.current.add(item.id);
      if (item.status === "pending") newlyPending.push(item.id);
    }
    if (newlyPending.length > 0) {
      setPendingSectionIds(prev => new Set([...prev, ...newlyPending]));
    }
  }, [items]);

  const pendingItems = useMemo(
    () => items.filter(i => pendingSectionIds.has(i.id)),
    [items, pendingSectionIds],
  );
  const processedItems = useMemo(
    () => items.filter(i => !pendingSectionIds.has(i.id)),
    [items, pendingSectionIds],
  );

  function resortNow() {
    classifiedRef.current = new Set(items.map(i => i.id));
    setPendingSectionIds(new Set(items.filter(i => i.status === "pending").map(i => i.id)));
  }

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
        blocked, rejected,
      }) => {
        const parts: string[] = [];
        if (blocked > 0) parts.push(`Blocked ${blocked} item${blocked === 1 ? "" : "s"}`);
        if (rejected > 0) parts.push(`rejected ${rejected} item${rejected === 1 ? "" : "s"}`);
        notifySuccess(
          parts.length === 0
            ? "No pending items matched any rules."
            : `${parts.join(", ")}.`,
        );
      },
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
    viewMode,
    setViewMode,
    columns,
    pendingCount,
    rejectedCount,
    pendingItems,
    processedItems,
    resortNow,
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
