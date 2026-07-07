import type {
  ImportItem,
  ImportItemStatus,
  InboxPreFillDefaults,
} from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Check, Eye, RotateCcw, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MoreActionsMenu } from "./InboxMoreActionsMenu";
import {
  notifyApprove,
  useApproveImportItem,
  useRejectImportItem,
  useUnrejectImportItem,
} from "../hooks/useImports";
import { notifySuccess } from "../lib/notifications";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Re-exported from their extracted module so existing importers keep their import site.

const STATUS_META: Record<ImportItemStatus, { label: string;
  variant: "secondary" | "default" | "destructive" | "outline"; }> = {
  pending: {
    label: "Pending",
    variant: "secondary",
  },
  approved: {
    label: "Added",
    variant: "default",
  },
  duplicate: {
    label: "Already saved",
    variant: "outline",
  },
  rejected: {
    label: "Rejected",
    variant: "outline",
  },
  error: {
    label: "Error",
    variant: "destructive",
  },
  blocked: {
    label: "Blocked",
    variant: "outline",
  },
};

export function StatusBadge({
  item,
}: { item: ImportItem }) {
  const meta = STATUS_META[item.status];
  const bookmarkId = item.createdBookmarkId ?? item.duplicateBookmarkId;
  if (bookmarkId) {
    return (
      <Link
        to="/bookmarks/$bookmarkId"
        params={{
          bookmarkId,
        }}
      >
        <Badge
          variant={meta.variant}
          className="cursor-pointer"
        >{meta.label}
        </Badge>
      </Link>
    );
  }
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

/** Reject control: one click rejects the candidate (block lives in the `MoreActionsMenu` submenu). */
function RejectButton({
  item,
}: { item: ImportItem }) {
  const {
    t,
  } = useTranslation();
  const reject = useRejectImportItem();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Reject"
          disabled={reject.isPending}
          onClick={() => reject.mutate(item.id, {
            onSuccess: () => notifySuccess(t("Rejected link")),
          })}
        >
          <X className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Reject</TooltipContent>
    </Tooltip>
  );
}

/** Unreject control: restore a rejected candidate to pending so it can be reviewed again. */
function UnrejectButton({
  item,
}: { item: ImportItem }) {
  const {
    t,
  } = useTranslation();
  const unreject = useUnrejectImportItem();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Restore to pending"
          disabled={unreject.isPending}
          onClick={() => unreject.mutate(item.id, {
            onSuccess: () => notifySuccess(t("Restored to pending")),
          })}
        >
          <RotateCcw className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Restore to pending</TooltipContent>
    </Tooltip>
  );
}

/** A "View bookmark" link button shown on approved/duplicate rows. */
function ViewBookmarkButton({
  bookmarkId,
}: { bookmarkId: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          size="icon"
          variant="ghost"
          aria-label="View bookmark"
        >
          <Link
            to="/bookmarks/$bookmarkId"
            params={{
              bookmarkId,
            }}
          >
            <Eye className="size-4" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>View bookmark</TooltipContent>
    </Tooltip>
  );
}

/** The per-row action column: approve/reject while pending, unreject once rejected, or a view link, plus a "More" menu. */
export function RowActions({
  item,
  preFill,
}: { item: ImportItem;
  preFill?: InboxPreFillDefaults; }) {
  const {
    t,
  } = useTranslation();
  const approve = useApproveImportItem();
  const resultBookmarkId = item.createdBookmarkId ?? item.duplicateBookmarkId;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {item.status === "pending"
        ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => approve.mutate({
                    itemId: item.id,
                    preFill,
                  }, {
                    onSuccess: result => notifyApprove(result, t),
                  })}
                  disabled={approve.isPending}
                  aria-label="Approve – save as bookmark"
                >
                  <Check className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Approve – save as bookmark</TooltipContent>
            </Tooltip>
            <RejectButton item={item} />
          </>
        )
        : null}
      {item.status === "rejected"
        ? <UnrejectButton item={item} />
        : null}
      {item.status !== "pending" && resultBookmarkId
        ? <ViewBookmarkButton bookmarkId={resultBookmarkId} />
        : null}
      <MoreActionsMenu item={item} />
    </div>
  );
}
