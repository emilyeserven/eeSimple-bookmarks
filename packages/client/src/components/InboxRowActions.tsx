import type {
  ImportApproveResult,
  ImportItem,
  ImportItemStatus,
} from "@eesimple/types";

import { blacklistPatternsFor } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Ban, Check, Eye, Pencil, RotateCcw, X } from "lucide-react";

import {
  useApproveImportItem,
  useBlockImportItem,
  useRejectImportItem,
  useUnrejectImportItem,
} from "../hooks/useImports";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

/** Surface the outcome of an approve call (one item or a bulk run) as a recorded toast. */
function notifyApprove(result: ImportApproveResult): void {
  if (result.status === "approved") notifySuccess("Bookmark added");
  else if (result.status === "duplicate") notifyError(result.message ?? "Already saved as a bookmark");
  else if (result.status === "error") notifyError(result.message ?? "Couldn't add bookmark");
}

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

/** Reject control: one click rejects the candidate (block offers a separate dropdown, see `BlockMenu`). */
function RejectButton({
  item,
}: { item: ImportItem }) {
  const reject = useRejectImportItem();
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Reject"
      disabled={reject.isPending}
      onClick={() => reject.mutate(item.id, {
        onSuccess: () => notifySuccess("Rejected link"),
      })}
    >
      <X className="size-4" />
    </Button>
  );
}

/** Unreject control: restore a rejected candidate to pending so it can be reviewed again. */
function UnrejectButton({
  item,
}: { item: ImportItem }) {
  const unreject = useUnrejectImportItem();
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Unreject"
      disabled={unreject.isPending}
      onClick={() => unreject.mutate(item.id, {
        onSuccess: () => notifySuccess("Restored to pending"),
      })}
    >
      <RotateCcw className="size-4" />
    </Button>
  );
}

/**
 * Block control: a dropdown to add this link's URL / domain / page path to the Imports Blacklist.
 * Blocking also marks the item `blocked` so the Import Settings purge can sweep it later.
 */
function BlockMenu({
  item,
}: { item: ImportItem }) {
  const block = useBlockImportItem();
  const patterns = item.url ? blacklistPatternsFor(item.url) : null;
  if (!patterns) return null;
  const blocked = item.status === "blocked";

  function blockWith(entry: { kind: "exact" | "domain" | "path-prefix";
    value: string; }, message: string) {
    block.mutate({
      itemId: item.id,
      entry,
    }, {
      onSuccess: () => notifySuccess(message),
      onError: () => notifyError("Couldn't block this link"),
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant={blocked ? "ghost" : "secondary"}
          className={blocked ? "gap-1 text-muted-foreground" : "gap-1"}
          disabled={block.isPending}
        >
          <Ban className="size-4" />
          {blocked ? "Blocked" : "Block"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => blockWith(patterns.exact, "Blocked this URL")}>
          Block this URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => blockWith(patterns.domain, `Blocked ${patterns.domain.value}`)}>
          Block this domain
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => blockWith(patterns.pathPrefix, "Blocked this page path")}>
          Block this page path
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A "View bookmark" link button shown on approved/duplicate rows. */
function ViewBookmarkButton({
  bookmarkId,
}: { bookmarkId: string }) {
  return (
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
  );
}

/** The per-row action column: approve/edit/reject/block while pending, unreject/block once rejected, or a view link. */
export function RowActions({
  item, onEdit,
}: { item: ImportItem;
  onEdit: () => void; }) {
  const approve = useApproveImportItem();
  const resultBookmarkId = item.createdBookmarkId ?? item.duplicateBookmarkId;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {item.status === "pending"
        ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => approve.mutate(item.id, {
                onSuccess: notifyApprove,
              })}
              disabled={approve.isPending}
              aria-label="Approve"
            >
              <Check className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              aria-label="Edit"
            >
              <Pencil className="size-4" />
            </Button>
            <RejectButton item={item} />
            <BlockMenu item={item} />
          </>
        )
        : null}
      {item.status === "rejected"
        ? (
          <>
            <UnrejectButton item={item} />
            <BlockMenu item={item} />
          </>
        )
        : null}
      {item.status !== "pending" && resultBookmarkId
        ? <ViewBookmarkButton bookmarkId={resultBookmarkId} />
        : null}
    </div>
  );
}
