import type {
  ImportItem,
  InboxItem,
} from "@eesimple/types";

import { useMemo, useState } from "react";

import { ChevronDown, ExternalLink, ShieldBan, Trash2 } from "lucide-react";

import { ViewModeToggle } from "./DisplayControlPrimitives";
import { RowActions, StatusBadge } from "./InboxRowActions";
import { formatAdded, useInboxColumns } from "./tables/inboxColumns";
import { useCategories } from "../hooks/useCategories";
import {
  useApproveImportItem,
  useDeleteRejectedItems,
  useRecheckPendingItems,
  useRejectPendingItems,
  useUpdateImportItem,
} from "../hooks/useImports";
import { useViewMode } from "../lib/bookmarkColumns";
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
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUiStore } from "@/stores/uiStore";

type ReviewFilter = "all" | "pending" | "issues";

/** Sentinel for the "no category" Select option (Radix forbids an empty-string item value). */
const NO_CATEGORY = "__none__";

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
          <p className="text-xs text-muted-foreground/70">Added {formatAdded(item.createdAt)}</p>
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
 * different imports. Renders as cards or a sortable table, remembered per page in `uiStore`.
 */
export function InboxReviewList({
  items,
}: {
  items: InboxItem[];
}) {
  const approve = useApproveImportItem();
  const rejectPending = useRejectPendingItems();
  const recheckPending = useRecheckPendingItems();
  const deleteRejected = useDeleteRejectedItems();
  const {
    data: categories = [],
  } = useCategories();
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [bulkRunning, setBulkRunning] = useState(false);
  const [editingItem, setEditingItem] = useState<InboxItem | null>(null);

  const viewMode = useViewMode("inbox");
  const setViewMode = useUiStore(state => state.setViewMode);
  const columns = useInboxColumns(categories, setEditingItem);

  const pendingCount = useMemo(() => items.filter(i => i.status === "pending").length, [items]);
  const rejectedCount = useMemo(() => items.filter(i => i.status === "rejected").length, [items]);
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

  function onRecheckBlocklist() {
    recheckPending.mutate(undefined, {
      onSuccess: ({
        blocked,
      }) => notifySuccess(
        blocked === 0
          ? "No pending items matched the block list."
          : `Blocked ${blocked} item${blocked === 1 ? "" : "s"} from the block list.`,
      ),
      onError: () => notifyError("Couldn't recheck the pending items."),
    });
  }

  function onDeleteRejected() {
    deleteRejected.mutate(undefined, {
      onSuccess: ({
        deleted,
      }) => notifySuccess(`Deleted ${deleted} rejected item${deleted === 1 ? "" : "s"}`),
      onError: () => notifyError("Couldn't delete the rejected items."),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
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
          <ViewModeToggle
            value={viewMode}
            onChange={mode => setViewMode("inbox", mode)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRecheckBlocklist}
            disabled={bulkRunning || recheckPending.isPending || pendingCount === 0}
          >
            <ShieldBan className="size-4" />
            {recheckPending.isPending ? "Rechecking…" : `Recheck block list (${pendingCount})`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDeleteRejected}
            disabled={bulkRunning || deleteRejected.isPending || rejectedCount === 0}
          >
            <Trash2 className="size-4" />
            {deleteRejected.isPending ? "Deleting…" : `Delete all rejected (${rejectedCount})`}
          </Button>
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

      {viewMode === "table"
        ? (
          <DataTable
            columns={columns}
            data={filtered}
            sortable
            emptyMessage="No items to show."
          />
        )
        : filtered.length === 0
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

      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit candidate</DialogTitle>
          </DialogHeader>
          {editingItem
            ? (
              <ReviewRowEditor
                item={editingItem}
                onDone={() => setEditingItem(null)}
              />
            )
            : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
