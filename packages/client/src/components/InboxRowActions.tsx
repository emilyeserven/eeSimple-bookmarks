import type {
  ImportApproveResult,
  ImportItem,
  ImportItemStatus,
  InboxPreFillDefaults,
} from "@eesimple/types";

import { useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Ban, Check, Eye, FolderInput, MoreHorizontal, RefreshCw, RotateCcw, Scissors, X } from "lucide-react";

import { MarkAsShortenerDialog } from "./MarkAsShortenerDialog";
import {
  useApproveImportItem,
  useBlockImportItem,
  useIngestUrl,
  useRecheckImportItemUrl,
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

/** Reject control: one click rejects the candidate (block lives in the `MoreActionsMenu` submenu). */
function RejectButton({
  item,
}: { item: ImportItem }) {
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
            onSuccess: () => notifySuccess("Rejected link"),
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
            onSuccess: () => notifySuccess("Restored to pending"),
          })}
        >
          <RotateCcw className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Restore to pending</TooltipContent>
    </Tooltip>
  );
}

/**
 * The three block menu items (URL / domain / page-path) plus the path-prefix dialog.
 * Extracted so `MoreActionsMenu` can embed them in a submenu without nesting dropdowns.
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
 * The single "More" (kebab) dropdown that collects the secondary row actions — Block URL and
 * Mark as link shortener (each a submenu over the embeddable `*MenuItems` fragments), plus Recheck
 * link URL and Import links from this URL — so they don't crowd the inline action bar.
 *
 * The shortener dialog is kept as a sibling of the `DropdownMenu` (not inside its content) so it
 * survives the menu closing; `BlockMenuItems` carries its own path-prefix dialog, which already runs
 * inside a dropdown today.
 */
function MoreActionsMenu({
  item,
}: { item: ImportItem }) {
  const recheck = useRecheckImportItemUrl();
  const ingest = useIngestUrl();
  const [shortenerMode, setShortenerMode] = useState<ShortenerMode | null>(null);
  const url = item.url;

  return (
    <>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="end">
            {url
              ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Ban className="size-4 text-muted-foreground" />
                    Block URL
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <BlockMenuItems item={item} />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
              : null}
            {url
              ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Scissors className="size-4 text-muted-foreground" />
                    Mark as link shortener
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <ShortenerMenuItems
                      item={item}
                      onSelect={m => setShortenerMode(m)}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
              : null}
            <DropdownMenuItem
              disabled={recheck.isPending}
              onClick={() =>
                recheck.mutate(item.id, {
                  onSuccess: ({
                    updated,
                  }) =>
                    updated ? notifySuccess("Link resolved") : notifySuccess("No change"),
                  onError: () => notifyError("Couldn't recheck this link"),
                })}
            >
              <RefreshCw className="size-4 text-muted-foreground" />
              Recheck link URL
            </DropdownMenuItem>
            {url
              ? (
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
                  <FolderInput className="size-4 text-muted-foreground" />
                  Import links from this URL
                </DropdownMenuItem>
              )
              : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>More actions</TooltipContent>
      </Tooltip>

      {shortenerMode !== null && (
        <MarkAsShortenerDialog
          item={item}
          open
          initialMode={shortenerMode}
          onClose={() => setShortenerMode(null)}
        />
      )}
    </>
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

type ShortenerMode = "ignore-list" | "website";

/**
 * The two shortener menu items (ignore list / associate with website). Extracted so
 * `MoreActionsMenu` can embed them in a submenu without nesting dropdowns.
 */
export function ShortenerMenuItems({
  item,
  onSelect,
}: {
  item: ImportItem;
  onSelect: (mode: ShortenerMode) => void;
}) {
  if (!item.url) return null;
  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          onSelect("ignore-list");
        }}
      >
        Add to shortener ignore list
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          onSelect("website");
        }}
      >
        Associate with website
      </DropdownMenuItem>
    </>
  );
}

/** The per-row action column: approve/reject while pending, unreject once rejected, or a view link, plus a "More" menu. */
export function RowActions({
  item,
  preFill,
}: { item: ImportItem;
  preFill?: InboxPreFillDefaults; }) {
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
                    onSuccess: notifyApprove,
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
