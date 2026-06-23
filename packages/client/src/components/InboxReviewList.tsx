import type {
  ImportApproveResult,
  ImportItem,
  InboxItem,
  ViewMode,
} from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useState } from "react";

import { ChevronDown, ExternalLink, Trash2 } from "lucide-react";

import { ViewModeToggle } from "./DisplayControlPrimitives";
import {
  MobileMoreMenu,
  RowActions,
  StatusBadge,
} from "./InboxRowActions";
import { formatAdded } from "./tables/inboxColumns";
import { useInboxReviewController } from "./useInboxReviewController";
import { useIsMobile } from "../hooks/use-mobile";
import { useCategories } from "../hooks/useCategories";
import {
  useApproveImportItem,
  useRejectImportItem,
  useUpdateImportItem,
} from "../hooks/useImports";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

/** Sentinel for the "no category" Select option (Radix forbids an empty-string item value). */
const NO_CATEGORY = "__none__";

function notifyApprove(result: ImportApproveResult): void {
  if (result.status === "approved") notifySuccess("Bookmark added");
  else if (result.status === "duplicate") notifyError(result.message ?? "Already saved as a bookmark");
  else if (result.status === "error") notifyError(result.message ?? "Couldn't add bookmark");
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

function ReviewRow({
  item,
}: { item: InboxItem }) {
  const {
    data: categories = [],
  } = useCategories();
  const [editing, setEditing] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const isMobile = useIsMobile();
  const approve = useApproveImportItem();
  const reject = useRejectImportItem();
  const {
    displacement, onTouchStart, onTouchMove, onTouchEnd,
  } = useSwipeGesture(
    () => approve.mutate(item.id, {
      onSuccess: notifyApprove,
    }),
    () => reject.mutate(item.id, {
      onSuccess: () => notifySuccess("Rejected link"),
    }),
  );

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

  if (isMobile && item.status === "pending") {
    const swipeRight = displacement >= 80;
    const swipeLeft = displacement <= -80;

    return (
      <div
        className="relative overflow-hidden rounded-lg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`
            absolute inset-0 transition-colors
            ${swipeRight ? "bg-green-500/20" : swipeLeft ? "bg-red-500/20" : ""}
          `}
        />
        <RowCard
          className="relative z-10 p-4"
          style={{
            transform: `translateX(${displacement}px)`,
            transition: displacement === 0 ? "transform 0.2s ease" : "none",
          }}
        >
          <div
            className="mb-2 flex justify-between text-xs text-muted-foreground"
          >
            <span className={swipeLeft ? "font-medium text-red-500" : ""}>← Reject</span>
            <span className={swipeRight ? "font-medium text-green-500" : ""}>Accept →</span>
          </div>

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
                          -ml-2 h-auto gap-1 px-2 py-1 text-xs
                          text-muted-foreground
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
                        mt-1 rounded-md bg-muted/40 p-2 text-xs
                        whitespace-pre-line text-muted-foreground
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
            <MobileMoreMenu
              item={item}
              onEdit={() => setEditing(true)}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              className="flex-1"
              variant="outline"
              disabled={reject.isPending}
              onClick={() => reject.mutate(item.id, {
                onSuccess: () => notifySuccess("Rejected link"),
              })}
            >
              Reject
            </Button>
            <Button
              className="flex-1"
              disabled={approve.isPending}
              onClick={() => approve.mutate(item.id, {
                onSuccess: notifyApprove,
              })}
            >
              Accept
            </Button>
          </div>
        </RowCard>
      </div>
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
        <div className="flex shrink-0 items-start gap-1">
          <RowActions
            item={item}
            onEdit={() => setEditing(true)}
          />
        </div>
      </div>
    </RowCard>
  );
}

/**
 * Renders one Inbox section's items as either a sortable table or a stack of cards (remembered per
 * page in `uiStore`). An empty section shows a message rather than a `DataTable`, so an empty
 * Processed/Pending section doesn't render a stray table header.
 */
function InboxItemsView({
  items, viewMode, columns, emptyMessage,
}: {
  items: InboxItem[];
  viewMode: ViewMode;
  columns: ColumnDef<InboxItem>[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  if (viewMode === "table") {
    return (
      <DataTable
        columns={columns}
        data={items}
        sortable
        emptyMessage={emptyMessage}
      />
    );
  }
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item.id}>
          <ReviewRow item={item} />
        </li>
      ))}
    </ul>
  );
}

/** The "Bulk Actions" dropdown: approve/reject all pending, delete all rejected, recheck blocklist. */
function InboxBulkActions({
  pendingCount,
  rejectedCount,
  bulkRunning,
  rejectPendingIsPending,
  recheckPendingIsPending,
  deleteRejectedIsPending,
  onApproveAll,
  onRejectAll,
  onRecheckBlocklist,
  onDeleteRejected,
}: Pick<
  ReturnType<typeof useInboxReviewController>,
  | "pendingCount"
  | "rejectedCount"
  | "bulkRunning"
  | "rejectPendingIsPending"
  | "recheckPendingIsPending"
  | "deleteRejectedIsPending"
  | "onApproveAll"
  | "onRejectAll"
  | "onRecheckBlocklist"
  | "onDeleteRejected"
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
          disabled={pendingCount === 0 || recheckPendingIsPending || bulkRunning}
          onClick={onRecheckBlocklist}
        >
          {recheckPendingIsPending ? "Rechecking…" : `Recheck block list (${pendingCount})`}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The Inbox review queue: import candidates from every import, split into a **Pending** and a
 * **Processed** section, plus a bulk "approve all pending" action. The split is frozen by snapshot
 * so a processed item doesn't jump sections immediately — "Sort now" re-partitions on demand. Each
 * row's actions are item-scoped, so the list can mix items from different imports. Renders as cards
 * or a sortable table, remembered per page in `uiStore`.
 */
export function InboxReviewList({
  items,
}: {
  items: InboxItem[];
}) {
  const controller = useInboxReviewController(items);
  const {
    viewMode,
    setViewMode,
    columns,
    pendingItems,
    processedItems,
    resortNow,
    editingItem,
    setEditingItem,
  } = controller;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ViewModeToggle
            value={viewMode}
            onChange={mode => setViewMode("inbox", mode)}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={resortNow}
          >
            Sort now
          </Button>
        </div>
        <InboxBulkActions {...controller} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Pending ({pendingItems.length})</h2>
        <InboxItemsView
          items={pendingItems}
          viewMode={viewMode}
          columns={columns}
          emptyMessage="No pending items."
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Processed ({processedItems.length})</h2>
        <InboxItemsView
          items={processedItems}
          viewMode={viewMode}
          columns={columns}
          emptyMessage="No processed items."
        />
      </section>

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
