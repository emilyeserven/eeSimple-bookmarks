import type {
  ImportApproveResult,
  ImportItem,
  ImportItemStatus,
} from "@eesimple/types";

import { useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Ban, Check, ChevronDown, Eye, FolderInput, MoreHorizontal, RefreshCw, RotateCcw, Scissors, X } from "lucide-react";

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
 * Slim dropdown trigger for block options (URL / domain / page path). Sits to the right of the
 * Reject button as a narrow chevron-only button so it doesn't crowd the action bar.
 */
function BlockDropdown({
  item,
}: { item: ImportItem }) {
  if (!item.url) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="px-1"
          aria-label="Block options"
        >
          <Ban className="size-3 text-muted-foreground" />
          <ChevronDown className="size-3 text-muted-foreground" />
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
      size="sm"
      variant="ghost"
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
      Queue for Import
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

type ShortenerMode = "ignore-list" | "website";

/**
 * The two shortener menu items (ignore list / associate with website). Extracted so both
 * `ShortenerDropdown` (desktop) and `MobileMoreMenu` can embed them without nesting dropdowns.
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

/**
 * Slim dropdown trigger for marking an inbox item's domain as a link shortener.
 * Mirrors the shape of `BlockDropdown`.
 */
function ShortenerDropdown({
  item,
}: { item: ImportItem }) {
  const [mode, setMode] = useState<ShortenerMode | null>(null);
  if (!item.url) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="px-1"
            aria-label="Mark as link shortener"
          >
            <Scissors className="size-3 text-muted-foreground" />
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ShortenerMenuItems
            item={item}
            onSelect={m => setMode(m)}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {mode !== null && (
        <MarkAsShortenerDialog
          item={item}
          open
          initialMode={mode}
          onClose={() => setMode(null)}
        />
      )}
    </>
  );
}

/** Secondary actions for the mobile pending card: Block options, Recheck link, and Queue for Import. */
export function MobileMoreMenu({
  item,
}: { item: ImportItem }) {
  const [shortenerMode, setShortenerMode] = useState<ShortenerMode | null>(null);

  return (
    <>
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
          <BlockMenuItems item={item} />
          <DropdownMenuSeparator />
          <ShortenerMenuItems
            item={item}
            onSelect={m => setShortenerMode(m)}
          />
          <DropdownMenuSeparator />
          <RecheckLinkMenuItem item={item} />
          <IngestImportMenuItem item={item} />
        </DropdownMenuContent>
      </DropdownMenu>

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

/** Re-run redirect unwrap for this item's rawUrl (retry after a failed resolution at ingest time). */
function RecheckLinkButton({
  item,
}: { item: ImportItem }) {
  const recheck = useRecheckImportItemUrl();
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Recheck link"
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
      <RefreshCw
        className={`
          size-4
          ${recheck.isPending ? "animate-spin" : ""}
        `}
      />
    </Button>
  );
}

/** DropdownMenuItem variant of `RecheckLinkButton` — for embedding inside an existing dropdown. */
export function RecheckLinkMenuItem({
  item,
}: { item: ImportItem }) {
  const recheck = useRecheckImportItemUrl();
  return (
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
      <RefreshCw className="size-4" />
      Recheck link
    </DropdownMenuItem>
  );
}

/** The per-row action column: approve/reject/block while pending, unreject/block once rejected, or a view link. */
export function RowActions({
  item,
}: { item: ImportItem }) {
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
            <RejectButton item={item} />
            <BlockDropdown item={item} />
            <ShortenerDropdown item={item} />
          </>
        )
        : null}
      {item.status === "rejected"
        ? (
          <>
            <UnrejectButton item={item} />
            <BlockDropdown item={item} />
            <ShortenerDropdown item={item} />
          </>
        )
        : null}
      {item.status !== "pending" && resultBookmarkId
        ? <ViewBookmarkButton bookmarkId={resultBookmarkId} />
        : null}
      <RecheckLinkButton item={item} />
      <IngestImportButton item={item} />
    </div>
  );
}
