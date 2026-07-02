import type { useSwipeGesture } from "../hooks/useSwipeGesture";
import type { CSSProperties, ReactNode } from "react";

type SwipeState = ReturnType<typeof useSwipeGesture>;

import { RowCard } from "@/components/ui/card";
import { useUiStore } from "@/stores/uiStore";

/**
 * Hover wrapper for a review row that maps to a created bookmark: syncs the hovered-bookmark id
 * (for the CMD+K "current bookmark" context) and shows the "⌘K to edit" hint. Rows without a
 * created bookmark render children unchanged inside the same group container.
 */
export function ReviewRowHoverShell({
  hoverId,
  children,
}: {
  hoverId: string | null;
  children: ReactNode;
}) {
  const setHoveredBookmarkId = useUiStore(state => state.setHoveredBookmarkId);
  return (
    <div
      className="group relative"
      onMouseEnter={hoverId ? () => setHoveredBookmarkId(hoverId) : undefined}
      onMouseLeave={hoverId ? () => setHoveredBookmarkId(null) : undefined}
    >
      {children}
      {hoverId
        ? (
          <span
            className="
              pointer-events-none absolute right-2 bottom-2 z-20 rounded-sm
              border bg-background/90 px-1.5 py-0.5 text-xs
              text-muted-foreground opacity-0 shadow-sm transition-opacity
              group-hover:opacity-100
            "
          >
            ⌘K to edit
          </span>
        )
        : null}
    </div>
  );
}

/**
 * The mobile swipe-to-approve/reject card: a colored reveal layer behind a translating RowCard.
 * Touch handling is disabled while a dialog is open so a sheet drag doesn't move the row.
 */
export function SwipeableReviewCard({
  swipe,
  disabled,
  children,
}: {
  swipe: SwipeState;
  disabled: boolean;
  children: ReactNode;
}) {
  const swipeRight = swipe.displacement >= 80;
  const swipeLeft = swipe.displacement <= -80;
  const cardStyle: CSSProperties = {
    transform: `translateX(${swipe.displacement}px)`,
    transition: swipe.displacement === 0 ? "transform 0.2s ease" : "none",
  };
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      onTouchStart={disabled ? undefined : swipe.onTouchStart}
      onTouchMove={disabled ? undefined : swipe.onTouchMove}
      onTouchEnd={disabled ? undefined : swipe.onTouchEnd}
    >
      <div
        className={`
          absolute inset-0 transition-colors
          ${swipeRight ? "bg-green-500/20" : swipeLeft ? "bg-red-500/20" : ""}
        `}
      />
      <RowCard
        className="relative z-10 p-4"
        style={cardStyle}
      >
        {children}
      </RowCard>
    </div>
  );
}
