import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useInboxReviewController } from "./useInboxReviewController";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** The "Bulk Actions" dropdown: approve/reject all pending, delete all rejected, recheck blocklist. */
export function InboxBulkActions({
  pendingCount,
  rejectedCount,
  addedCount,
  blockedCount,
  bulkRunning,
  rejectPendingIsPending,
  recheckPendingIsPending,
  deleteRejectedIsPending,
  deleteAddedIsPending,
  deleteBlockedIsPending,
  onApproveAll,
  onRejectAll,
  onRecheckBlocklist,
  onDeleteRejected,
  onDeleteAdded,
  onDeleteBlocked,
}: Pick<
  ReturnType<typeof useInboxReviewController>,
  | "pendingCount"
  | "rejectedCount"
  | "addedCount"
  | "blockedCount"
  | "bulkRunning"
  | "rejectPendingIsPending"
  | "recheckPendingIsPending"
  | "deleteRejectedIsPending"
  | "deleteAddedIsPending"
  | "deleteBlockedIsPending"
  | "onApproveAll"
  | "onRejectAll"
  | "onRecheckBlocklist"
  | "onDeleteRejected"
  | "onDeleteAdded"
  | "onDeleteBlocked"
>) {
  const {
    t,
  } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
        >
          {t("Bulk Actions")}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={pendingCount === 0 || bulkRunning || rejectPendingIsPending}
          onClick={onApproveAll}
        >
          {bulkRunning
            ? t("Approving…")
            : t("Approve all pending ({{count}})", {
              count: pendingCount,
            })}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pendingCount === 0 || rejectPendingIsPending || bulkRunning}
          onClick={onRejectAll}
        >
          {rejectPendingIsPending
            ? t("Rejecting…")
            : t("Reject all pending ({{count}})", {
              count: pendingCount,
            })}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={rejectedCount === 0 || deleteRejectedIsPending}
          onClick={onDeleteRejected}
        >
          {deleteRejectedIsPending
            ? t("Deleting…")
            : t("Delete all rejected ({{count}})", {
              count: rejectedCount,
            })}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={addedCount === 0 || deleteAddedIsPending}
          onClick={onDeleteAdded}
        >
          {deleteAddedIsPending
            ? t("Deleting…")
            : t("Delete all added ({{count}})", {
              count: addedCount,
            })}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={blockedCount === 0 || deleteBlockedIsPending}
          onClick={onDeleteBlocked}
        >
          {deleteBlockedIsPending
            ? t("Deleting…")
            : t("Delete all blocked ({{count}})", {
              count: blockedCount,
            })}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pendingCount === 0 || recheckPendingIsPending || bulkRunning}
          onClick={onRecheckBlocklist}
        >
          {recheckPendingIsPending
            ? t("Rechecking…")
            : t("Recheck block list ({{count}})", {
              count: pendingCount,
            })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
