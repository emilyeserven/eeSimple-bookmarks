import { ChevronDown } from "lucide-react";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
        >
          Bulk Actions
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={pendingCount === 0 || bulkRunning || rejectPendingIsPending}
          onClick={onApproveAll}
        >
          {bulkRunning ? "Approving…" : `Approve all pending (${pendingCount})`}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pendingCount === 0 || rejectPendingIsPending || bulkRunning}
          onClick={onRejectAll}
        >
          {rejectPendingIsPending ? "Rejecting…" : `Reject all pending (${pendingCount})`}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={rejectedCount === 0 || deleteRejectedIsPending}
          onClick={onDeleteRejected}
        >
          {deleteRejectedIsPending ? "Deleting…" : `Delete all rejected (${rejectedCount})`}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={addedCount === 0 || deleteAddedIsPending}
          onClick={onDeleteAdded}
        >
          {deleteAddedIsPending ? "Deleting…" : `Delete all added (${addedCount})`}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={blockedCount === 0 || deleteBlockedIsPending}
          onClick={onDeleteBlocked}
        >
          {deleteBlockedIsPending ? "Deleting…" : `Delete all blocked (${blockedCount})`}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pendingCount === 0 || recheckPendingIsPending || bulkRunning}
          onClick={onRecheckBlocklist}
        >
          {recheckPendingIsPending ? "Rechecking…" : `Recheck block list (${pendingCount})`}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
