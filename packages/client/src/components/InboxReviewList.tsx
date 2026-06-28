import type {
  InboxItem,
  InboxPreFillDefaults,
  ViewMode,
} from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { ChevronDown, ExternalLink, Trash2 } from "lucide-react";

import { ImportItemAdvancedEdit } from "./ImportItemAdvancedEdit";
import { InboxPreFillBox } from "./InboxPreFillBox";
import {
  RowActions,
  StatusBadge,
} from "./InboxRowActions";
import { formatAdded } from "./tables/inboxColumns";
import { useInboxReviewController } from "./useInboxReviewController";
import { useReviewRowController } from "./useReviewRowController";
import { highlightAnchor } from "../lib/newsletterContext";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ReviewRow({
  item,
  onDismiss,
  preFill,
}: { item: InboxItem;
  onDismiss?: (id: string) => void;
  preFill?: InboxPreFillDefaults; }) {
  const {
    contextOpen, setContextOpen, advancedEditOpen, setAdvancedEditOpen,
    itemPreFill, effectivePreFill, isMobile, muted, categoryName, swipe,
    patchItemPreFill,
  } = useReviewRowController(item, preFill, onDismiss);

  const rowActions = (
    <RowActions
      item={item}
      preFill={effectivePreFill}
    />
  );
  const advancedEdit = item.status === "pending"
    ? (
      <ImportItemAdvancedEdit
        item={item}
        open={advancedEditOpen}
        onOpenChange={setAdvancedEditOpen}
        categoryId={itemPreFill.categoryId ?? undefined}
        mediaTypeId={itemPreFill.mediaTypeId ?? undefined}
        tagIds={itemPreFill.tagIds ?? []}
        authorIds={itemPreFill.authorIds ?? []}
        publisherId={itemPreFill.publisherId ?? undefined}
        onCategoryChange={id => patchItemPreFill({
          categoryId: id,
        })}
        onMediaTypeChange={id => patchItemPreFill({
          mediaTypeId: id,
        })}
        onTagsChange={ids => patchItemPreFill({
          tagIds: ids,
        })}
        onAuthorsChange={ids => patchItemPreFill({
          authorIds: ids,
        })}
        onPublisherChange={id => patchItemPreFill({
          publisherId: id,
        })}
      />
    )
    : null;

  if (isMobile && item.status === "pending") {
    const swipeRight = swipe.displacement >= 80;
    const swipeLeft = swipe.displacement <= -80;

    return (
      <div
        className="relative overflow-hidden rounded-lg"
        onTouchStart={advancedEditOpen ? undefined : swipe.onTouchStart}
        onTouchMove={advancedEditOpen ? undefined : swipe.onTouchMove}
        onTouchEnd={advancedEditOpen ? undefined : swipe.onTouchEnd}
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
            transform: `translateX(${swipe.displacement}px)`,
            transition: swipe.displacement === 0 ? "transform 0.2s ease" : "none",
          }}
        >
          <ReviewItemBody
            item={item}
            categoryName={categoryName}
            contextOpen={contextOpen}
            onContextOpenChange={setContextOpen}
            trailing={rowActions}
            advancedEdit={advancedEdit}
          />
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
      <ReviewItemBody
        item={item}
        categoryName={categoryName}
        contextOpen={contextOpen}
        onContextOpenChange={setContextOpen}
        trailing={rowActions}
        advancedEdit={advancedEdit}
      />
    </RowCard>
  );
}

/** The image + metadata column shared by the mobile-swipe and desktop review-row layouts. */
function ReviewItemBody({
  item, categoryName, contextOpen, onContextOpenChange, trailing, advancedEdit,
}: {
  item: InboxItem;
  categoryName: string | null;
  contextOpen: boolean;
  onContextOpenChange: (open: boolean) => void;
  trailing?: ReactNode;
  advancedEdit?: ReactNode;
}) {
  return (
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
      <div className="min-w-0 flex-1 space-y-2">
        {/* Row 1: Title + From | Buttons */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div
            className="
              w-full min-w-0 space-y-0.5
              md:w-auto md:flex-1
            "
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="min-w-0 font-medium wrap-break-word">{item.title || item.anchorText || item.url || item.rawUrl}</p>
              <StatusBadge item={item} />
              {(item.markedForDeletion || item.status === "rejected")
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
          </div>
          {trailing
            ? <div className="flex shrink-0 items-start">{trailing}</div>
            : null}
        </div>

        {/* Row 2: Link */}
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

        {/* Row 3: Context */}
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
            <NewsletterContextBlock
              context={item.newsletterContext}
              anchorText={item.anchorText}
              open={contextOpen}
              onOpenChange={onContextOpenChange}
            />
          )
          : null}

        {/* Row 4: Date added */}
        <p className="text-xs text-muted-foreground/70">Added {formatAdded(item.createdAt)}</p>
        {advancedEdit}
      </div>
    </div>
  );
}

/** The collapsible captured-passage block, with the link's anchor text bolded. */
function NewsletterContextBlock({
  context, anchorText, open, onOpenChange,
}: {
  context: string;
  anchorText: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
    >
      <CollapsibleTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="-ml-2 h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
        >
          <ChevronDown
            className={`
              size-3 transition-transform
              ${open ? "rotate-180" : ""}
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
        {highlightAnchor(context, anchorText).map((segment, index) =>
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
  );
}

/**
 * Renders one Inbox section's items as either a sortable table or a stack of cards (remembered per
 * page in `uiStore`). An empty section shows a message rather than a `DataTable`, so an empty
 * Processed/Pending section doesn't render a stray table header.
 */
function InboxItemsView({
  items, viewMode, columns, emptyMessage, onDismiss, preFill,
}: {
  items: InboxItem[];
  viewMode: ViewMode;
  columns: ColumnDef<InboxItem>[];
  emptyMessage: string;
  onDismiss?: (id: string) => void;
  preFill?: InboxPreFillDefaults;
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
          <ReviewRow
            item={item}
            onDismiss={onDismiss}
            preFill={preFill}
          />
        </li>
      ))}
    </ul>
  );
}

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

/**
 * The Inbox review queue: Pending and Processed sections rendered from a controller that is owned
 * by the parent page (so the page can hoist the controls into its title bar). The split is frozen
 * by snapshot so a processed item doesn't jump sections immediately — "Sort now" re-partitions on
 * demand. Each row's actions are item-scoped, so the list can mix items from different imports.
 * Renders as cards or a sortable table, remembered per page in `uiStore`.
 */
export function InboxReviewList({
  controller,
}: {
  controller: ReturnType<typeof useInboxReviewController>;
}) {
  const {
    viewMode,
    columns,
    pendingItems,
    processedItems,
    dismissItem,
    processedHidden,
    toggleProcessedHidden,
    preFill,
    setPreFill,
    resetPreFill,
  } = controller;

  return (
    <div className="space-y-6">
      <InboxPreFillBox
        preFill={preFill}
        setPreFill={setPreFill}
        onReset={resetPreFill}
      />
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Pending ({pendingItems.length})</h2>
        <InboxItemsView
          items={pendingItems}
          viewMode={viewMode}
          columns={columns}
          emptyMessage="No pending items."
          onDismiss={dismissItem}
          preFill={preFill}
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Processed ({processedItems.length})</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-auto px-2 py-0.5 text-xs text-muted-foreground"
            onClick={toggleProcessedHidden}
          >
            {processedHidden ? "Show" : "Hide"}
          </Button>
        </div>
        {!processedHidden && (
          <InboxItemsView
            items={processedItems}
            viewMode={viewMode}
            columns={columns}
            emptyMessage="No processed items."
          />
        )}
      </section>
    </div>
  );
}
