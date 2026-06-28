import type { ImportApproveResult, InboxItem, InboxPreFillDefaults } from "@eesimple/types";

import { useState } from "react";

import { mergeInboxPreFill } from "./inboxPreFillMerge";
import { useIsMobile } from "../hooks/use-mobile";
import { useCategories } from "../hooks/useCategories";
import {
  useApproveImportItem,
  useRejectImportItem,
} from "../hooks/useImports";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import { notifyError, notifySuccess } from "../lib/notifications";

function notifyApprove(result: ImportApproveResult): void {
  if (result.status === "approved") notifySuccess("Bookmark added");
  else if (result.status === "duplicate") notifyError(result.message ?? "Already saved as a bookmark");
  else if (result.status === "error") notifyError(result.message ?? "Couldn't add bookmark");
}

/**
 * Owns every hook, derivation, and handler a single Inbox `ReviewRow` needs — categories, the
 * per-item advanced-edit state, the swipe gesture, and the approve/reject mutations — so the row
 * component stays a thin JSX shell below fallow's hook-density cap (see CLAUDE.md → Large-form
 * decomposition). The batch/per-item prefill merge is delegated to the pure {@link mergeInboxPreFill}.
 */
export function useReviewRowController(
  item: InboxItem,
  preFill: InboxPreFillDefaults | undefined,
  onDismiss: ((id: string) => void) | undefined,
) {
  const {
    data: categories = [],
  } = useCategories();
  const [contextOpen, setContextOpen] = useState(false);
  const [advancedEditOpen, setAdvancedEditOpen] = useState(false);
  const [itemPreFill, setItemPreFill] = useState<InboxPreFillDefaults>({
    categoryId: item.categoryId ?? undefined,
    mediaTypeId: undefined,
    tagIds: [],
    authorIds: [],
    publisherId: undefined,
  });
  const isMobile = useIsMobile();
  const approve = useApproveImportItem();
  const reject = useRejectImportItem();

  const effectivePreFill = mergeInboxPreFill(itemPreFill, preFill);

  const swipe = useSwipeGesture(
    () => {
      onDismiss?.(item.id);
      approve.mutate({
        itemId: item.id,
        preFill: effectivePreFill,
      }, {
        onSuccess: notifyApprove,
      });
    },
    () => {
      onDismiss?.(item.id);
      reject.mutate(item.id, {
        onSuccess: () => notifySuccess("Rejected link"),
      });
    },
  );

  const muted = item.status === "rejected" || item.status === "approved"
    || item.status === "duplicate" || item.status === "blocked";
  const categoryName = categories.find(c => c.id === item.categoryId)?.name ?? null;

  /** Patch one field of the per-item advanced-edit prefill. */
  function patchItemPreFill(patch: Partial<InboxPreFillDefaults>) {
    setItemPreFill(prev => ({
      ...prev,
      ...patch,
    }));
  }

  return {
    contextOpen,
    setContextOpen,
    advancedEditOpen,
    setAdvancedEditOpen,
    itemPreFill,
    effectivePreFill,
    isMobile,
    muted,
    categoryName,
    swipe,
    patchItemPreFill,
  };
}
