import type { ImportApproveResult, InboxItem, InboxPreFillDefaults } from "@eesimple/types";

import { useState } from "react";

import { mergeInboxPreFill } from "./inboxPreFillMerge";
import { useInboxPrefillSeed } from "./useInboxPrefillSeed";
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
  // Seed the per-item advanced-edit fields from the matching system (autofill rules + website /
  // YouTube-channel defaults) so the user reviews/overrides instead of starting empty.
  const {
    itemPreFill,
    patchItemPreFill,
  } = useInboxPrefillSeed(item, advancedEditOpen);
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
