import type {
  ImportApproveResult,
  ImportItem,
  ImportItemStatus,
} from "@eesimple/types";

import { useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Ban, Check, Eye, FolderInput, MoreHorizontal, Pencil, RotateCcw, X } from "lucide-react";

import {
  useApproveImportItem,
  useBlockImportItem,
  useIngestUrl,
  useRejectImportItem,
  useUnrejectImportItem,
} from "../hooks/useImports";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

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
 * The three block menu items (URL / domain / page-path) plus the path-prefix dialog.
 * Extracted so `BlockMenu` (its own DropdownMenu) and `MobileMoreMenu` (embeds inline)
 * can both use them without nesting dropdowns.
 */
export function BlockMenuItems({
  item,
}: { item: ImportItem }) {
  const block = useBlockImportItem();
  const [pathPrefixDialog, setPathPrefixDialog] = useState<string | null>(null);

  const patterns = item.url ? blacklistPatternsFor(item.url) : null;
  if (!patterns) return null;

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
    <>
      <DropdownMenuItem onClick={() => blockWith(patterns.exact, "Blocked this URL")}>
        Block this URL
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => blockWith(patterns.domain, `Blocked ${patterns.domain.value}`)}>
        Block this domain
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={(e) => {
          // Prevent Radix from auto-closing the dropdown before the dialog can take focus.
          e.preventDefault();
          setPathPrefixDialog(patterns.pathPrefix.value);
        }}
      >
        Block this page path
      </DropdownMenuItem>

      <Dialog
        open={pathPrefixDialog !== null}
        onOpenChange={(open) => {
          if (!open) setPathPrefixDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block page path</DialogTitle>
            <DialogDescription>
              Block any URL whose path starts with this prefix (including the host). Shorten
              the path to block a wider set of URLs from the same site.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={pathPrefixDialog ?? ""}
            onChange={e => setPathPrefixDialog(e.target.value)}
            aria-label="Path prefix"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPathPrefixDialog(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!pathPrefixDialog || block.isPending}
              onClick={() => {
                if (!pathPrefixDialog) return;
                blockWith({
                  kind: "path-prefix",
                  value: pathPrefixDialog,
                }, "Blocked this page path");
                setPathPrefixDialog(null);
              }}
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Block control: a dropdown to add this link's URL / domain / page path to the Imports Blacklist.
 * Blocking also marks the item `blocked` so the Import Settings purge can sweep it later.
 */
function BlockMenu({
  item,
}: { item: ImportItem }) {
  if (!item.url) return null;
  const blocked = item.status === "blocked";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant={blocked ? "ghost" : "secondary"}
          className={blocked ? "gap-1 text-muted-foreground" : "gap-1"}
        >
          <Ban className="size-4" />
          {blocked ? "Blocked" : "Block"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <BlockMenuItems item={item} />
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

/** Queue this item's URL as a new import so its links can be extracted and reviewed. */
function IngestImportButton({
  item,
}: { item: ImportItem }) {
  const ingest = useIngestUrl();
  const url = item.url;
  if (!url) return null;
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Import links from this URL"
      disabled={ingest.isPending}
      onClick={() =>
        ingest.mutate({
          url,
        }, {
          onSuccess: () => notifySuccess("Queued as new import group"),
          onError: () => notifyError("Couldn't queue this URL for import"),
        })}
    >
      <FolderInput className="size-4" />
    </Button>
  );
}

/** DropdownMenuItem variant of `IngestImportButton` — for embedding inside an existing dropdown. */
export function IngestImportMenuItem({
  item,
}: { item: ImportItem }) {
  const ingest = useIngestUrl();
  const url = item.url;
  if (!url) return null;
  return (
    <DropdownMenuItem
      disabled={ingest.isPending}
      onClick={() =>
        ingest.mutate({
          url,
        }, {
          onSuccess: () => notifySuccess("Queued as new import group"),
          onError: () => notifyError("Couldn't queue this URL for import"),
        })}
    >
      <FolderInput className="size-4" />
      Import links from this URL
    </DropdownMenuItem>
  );
}

/** Secondary actions for the mobile pending card: Edit, Block options, and Import links. */
export function MobileMoreMenu({
  item, onEdit,
}: { item: ImportItem;
  onEdit: () => void; }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="More actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <BlockMenuItems item={item} />
        <DropdownMenuSeparator />
        <IngestImportMenuItem item={item} />
      </DropdownMenuContent>
    </DropdownMenu>
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
      <IngestImportButton item={item} />
    </div>
  );
}
