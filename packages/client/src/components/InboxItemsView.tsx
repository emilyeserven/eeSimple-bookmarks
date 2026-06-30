import type {
  InboxItem,
  InboxPreFillDefaults,
  ViewMode,
} from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { ExternalLink, Trash2 } from "lucide-react";

import { ImportItemAdvancedEdit } from "./ImportItemAdvancedEdit";
import {
  RowActions,
  StatusBadge,
} from "./InboxRowActions";
import { NewsletterContextBlock } from "./NewsletterContextBlock";
import { formatAdded } from "./tables/inboxColumns";
import { useReviewRowController } from "./useReviewRowController";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useUiStore } from "@/stores/uiStore";

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
  const setHoveredBookmarkId = useUiStore(state => state.setHoveredBookmarkId);

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
        locationIds={itemPreFill.locationIds ?? []}
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
        onLocationsChange={ids => patchItemPreFill({
          locationIds: ids,
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

  const hoverId = item.createdBookmarkId ?? null;
  const hoverCmdk = hoverId
    ? (
      <span
        className="
          pointer-events-none absolute right-2 bottom-2 z-20 rounded-sm border
          bg-background/90 px-1.5 py-0.5 text-xs text-muted-foreground opacity-0
          shadow-sm transition-opacity
          group-hover:opacity-100
        "
      >
        ⌘K to edit
      </span>
    )
    : null;

  if (isMobile && item.status === "pending") {
    const swipeRight = swipe.displacement >= 80;
    const swipeLeft = swipe.displacement <= -80;

    return (
      <div
        className="group relative"
        onMouseEnter={hoverId ? () => setHoveredBookmarkId(hoverId) : undefined}
        onMouseLeave={hoverId ? () => setHoveredBookmarkId(null) : undefined}
      >
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
        {hoverCmdk}
      </div>
    );
  }

  return (
    <div
      className="group relative"
      onMouseEnter={hoverId ? () => setHoveredBookmarkId(hoverId) : undefined}
      onMouseLeave={hoverId ? () => setHoveredBookmarkId(null) : undefined}
    >
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
      {hoverCmdk}
    </div>
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

/**
 * Renders one Inbox section's items as either a sortable table or a stack of cards (remembered per
 * page in `uiStore`). An empty section shows a message rather than a `DataTable`, so an empty
 * Processed/Pending section doesn't render a stray table header.
 */
export function InboxItemsView({
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
