import type {
  ImportApproveResult,
  ImportItem,
  ImportItemStatus,
  InboxItem,
} from "@eesimple/types";

import { useMemo, useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Ban, Check, ChevronDown, ExternalLink, Eye, Pencil, RotateCcw, Trash2, X } from "lucide-react";

import { useCategories } from "../hooks/useCategories";
import {
  useApproveImportItem,
  useBlockImportItem,
  useRejectImportItem,
  useRejectPendingItems,
  useUnrejectImportItem,
  useUpdateImportItem,
} from "../hooks/useImports";
import { highlightAnchor } from "../lib/newsletterContext";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReviewFilter = "all" | "pending" | "issues";

/** Sentinel for the "no category" Select option (Radix forbids an empty-string item value). */
const NO_CATEGORY = "__none__";

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

function StatusBadge({
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

/** The expanded edit form for one candidate (url/title/description/category). Owns its own draft. */
function ReviewRowEditor({
  item, onDone,
}: { item: ImportItem;
  onDone: () => void; }) {
  const update = useUpdateImportItem();
  const {
    data: categories = [],
  } = useCategories();
  const [draft, setDraft] = useState({
    url: item.url ?? "",
    title: item.title ?? "",
    description: item.description ?? "",
    categoryId: item.categoryId ?? "",
  });

  function onSave() {
    update.mutate(
      {
        itemId: item.id,
        input: {
          url: draft.url,
          title: draft.title || null,
          description: draft.description || null,
          categoryId: draft.categoryId || null,
        },
      },
      {
        onSuccess: () => {
          notifySuccess("Updated candidate");
          onDone();
        },
        onError: () => notifyError("Couldn't save candidate"),
      },
    );
  }

  return (
    <RowCard className="space-y-2 p-4">
      <Input
        value={draft.url}
        onChange={event => setDraft(d => ({
          ...d,
          url: event.target.value,
        }))}
        placeholder="URL"
        aria-label="URL"
      />
      <Input
        value={draft.title}
        onChange={event => setDraft(d => ({
          ...d,
          title: event.target.value,
        }))}
        placeholder="Title"
        aria-label="Title"
      />
      <Textarea
        value={draft.description}
        onChange={event => setDraft(d => ({
          ...d,
          description: event.target.value,
        }))}
        placeholder="Description"
        rows={2}
        aria-label="Description"
      />
      <Select
        value={draft.categoryId || NO_CATEGORY}
        onValueChange={value => setDraft(d => ({
          ...d,
          categoryId: value === NO_CATEGORY ? "" : value,
        }))}
      >
        <SelectTrigger aria-label="Category">
          <SelectValue placeholder="Category (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_CATEGORY}>No category</SelectItem>
          {categories.map(category => (
            <SelectItem
              key={category.id}
              value={category.id}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSave}
          disabled={update.isPending}
        >Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDone}
        >Cancel
        </Button>
      </div>
    </RowCard>
  );
}

/** The per-row action column: approve/edit/reject/block while pending, unreject/block once rejected, or a view link. */
function RowActions({
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

function ReviewRow({
  item,
}: { item: InboxItem }) {
  const {
    data: categories = [],
  } = useCategories();
  const [editing, setEditing] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const muted = item.status === "rejected" || item.status === "approved"
    || item.status === "duplicate" || item.status === "blocked";
  const categoryName = categories.find(c => c.id === item.categoryId)?.name ?? null;

  if (editing) {
    return (
      <ReviewRowEditor
        item={item}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <RowCard
      className={`
        p-4
        ${muted ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {item.imageUrl
          ? (
            <img
              src={item.imageUrl}
              alt=""
              className="size-12 shrink-0 rounded-sm object-cover"
            />
          )
          : null}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 font-medium wrap-break-word">{item.title || item.anchorText || item.url || item.rawUrl}</p>
            <StatusBadge item={item} />
            {item.markedForDeletion
              ? (
                <Badge
                  variant="outline"
                  className="gap-1 text-muted-foreground"
                >
                  <Trash2 className="size-3" />
                  Will be deleted
                </Badge>
              )
              : null}
          </div>
          {item.sourceLabel
            ? <p className="text-xs text-muted-foreground/70">From {item.sourceLabel}</p>
            : null}
          {item.url
            ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-start gap-1 text-sm text-muted-foreground
                  hover:underline
                "
              >
                <ExternalLink className="mt-0.5 size-3 shrink-0" />
                <span className="min-w-0 break-all">{item.url}</span>
              </a>
            )
            : null}
          {item.url && item.rawUrl !== item.url
            ? <p className="text-xs break-all text-muted-foreground/70">via {item.rawUrl}</p>
            : null}
          {categoryName
            ? <p className="text-xs text-muted-foreground">Category: {categoryName}</p>
            : null}
          {item.status === "error" && item.errorReason
            ? <p className="text-xs text-destructive">{item.errorReason}</p>
            : null}
          {item.description
            ? (
              <p
                className={`
                  text-sm text-muted-foreground
                  ${contextOpen ? "" : "line-clamp-2"}
                `}
              >
                {item.description}
              </p>
            )
            : null}
          {item.newsletterContext
            ? (
              <Collapsible
                open={contextOpen}
                onOpenChange={setContextOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="
                      -ml-2 h-auto gap-1 px-2 py-1 text-xs text-muted-foreground
                    "
                  >
                    <ChevronDown
                      className={`
                        size-3 transition-transform
                        ${contextOpen ? "rotate-180" : ""}
                      `}
                    />
                    Context
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent
                  className="
                    mt-1 rounded-md bg-muted/40 p-2 text-xs whitespace-pre-line
                    text-muted-foreground
                  "
                >
                  {highlightAnchor(item.newsletterContext, item.anchorText).map((segment, index) =>
                    segment.bold
                      ? (
                        <strong
                          key={index}
                          className="font-semibold text-foreground"
                        >
                          {segment.text}
                        </strong>
                      )
                      : <span key={index}>{segment.text}</span>)}
                </CollapsibleContent>
              </Collapsible>
            )
            : null}
        </div>
        <RowActions
          item={item}
          onEdit={() => setEditing(true)}
        />
      </div>
    </RowCard>
  );
}

/**
 * The Inbox review queue: a filterable list of import candidates from every import, plus a bulk
 * "approve all pending" action. Each row's actions are item-scoped, so the list can mix items from
 * different imports.
 */
export function InboxReviewList({
  items,
}: {
  items: InboxItem[];
}) {
  const approve = useApproveImportItem();
  const rejectPending = useRejectPendingItems();
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [bulkRunning, setBulkRunning] = useState(false);

  const pendingCount = useMemo(() => items.filter(i => i.status === "pending").length, [items]);
  const filtered = useMemo(() => items.filter((item) => {
    if (filter === "pending") return item.status === "pending";
    if (filter === "issues") return item.status === "error" || item.status === "duplicate";
    return true;
  }), [items, filter]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["all", "pending", "issues"] as const).map(value => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "secondary" : "ghost"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : value === "pending" ? "Pending" : "Issues"}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRejectAll}
            disabled={bulkRunning || rejectPending.isPending || pendingCount === 0}
          >
            {rejectPending.isPending ? "Rejecting…" : `Reject all pending (${pendingCount})`}
          </Button>
          <Button
            size="sm"
            onClick={onApproveAll}
            disabled={bulkRunning || rejectPending.isPending || pendingCount === 0}
          >
            {bulkRunning ? "Approving…" : `Approve all pending (${pendingCount})`}
          </Button>
        </div>
      </div>

      {filtered.length === 0
        ? <p className="text-sm text-muted-foreground">No items to show.</p>
        : (
          <ul className="space-y-2">
            {filtered.map(item => (
              <li key={item.id}>
                <ReviewRow item={item} />
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
