import type {
  ImportItem,
  InboxItem,
} from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, ExternalLink, ShieldBan, Trash2 } from "lucide-react";

import { ViewModeToggle } from "./DisplayControlPrimitives";
import { RowActions, StatusBadge } from "./InboxRowActions";
import { formatAdded } from "./tables/inboxColumns";
import { useInboxReviewController } from "./useInboxReviewController";
import { useCategories } from "../hooks/useCategories";
import { useUpdateImportItem } from "../hooks/useImports";
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
  const {
    filter,
    setFilter,
    viewMode,
    setViewMode,
    columns,
    pendingCount,
    rejectedCount,
    filtered,
    editingItem,
    setEditingItem,
    bulkRunning,
    rejectPendingIsPending,
    recheckPendingIsPending,
    deleteRejectedIsPending,
    onApproveAll,
    onRejectAll,
    onRecheckBlocklist,
    onDeleteRejected,
  } = useInboxReviewController(items);

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
            disabled={bulkRunning || recheckPendingIsPending || pendingCount === 0}
          >
            <ShieldBan className="size-4" />
            {recheckPendingIsPending ? "Rechecking…" : `Recheck block list (${pendingCount})`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDeleteRejected}
            disabled={bulkRunning || deleteRejectedIsPending || rejectedCount === 0}
          >
            <Trash2 className="size-4" />
            {deleteRejectedIsPending ? "Deleting…" : `Delete all rejected (${rejectedCount})`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRejectAll}
            disabled={bulkRunning || rejectPendingIsPending || pendingCount === 0}
          >
            {rejectPendingIsPending ? "Rejecting…" : `Reject all pending (${pendingCount})`}
          </Button>
          <Button
            size="sm"
            onClick={onApproveAll}
            disabled={bulkRunning || rejectPendingIsPending || pendingCount === 0}
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
