import type { CardImageCorner } from "@eesimple/types";
import type { ReactNode } from "react";

import { useIsMobile } from "../hooks/use-mobile";
import { CARD_IMAGE_CORNERS } from "../lib/bookmarkCardValues";

/** A single field overlaid in one of a card image's corners: its rendered node + overlay scaling. */
export interface CardOverlayItem {
  /** Stable key (standard field key or custom-property id). */
  key: string;
  corner: CardImageCorner;
  /** Desktop overlay scale (0.75, 1, 1.5, or 2). */
  scale: number;
  /** Mobile overlay scale; `null` inherits `scale`. */
  mobileScale: number | null;
  node: ReactNode;
}

interface CardImageOverlaysProps {
  /** The fields placed in image corners, already rendered to nodes. Grouped by corner and positioned. */
  items: CardOverlayItem[];
}

/**
 * Renders fields overlaid in the corners of a bookmark card's image. Expects its parent to be
 * `position: relative`. Each corner stacks its items vertically; an item is enlarged up to 2x anchored
 * at its corner (so it grows inward), using the mobile scale on small screens when set.
 */
export function CardImageOverlays({
  items,
}: CardImageOverlaysProps) {
  const isMobile = useIsMobile();
  return (
    <>
      {CARD_IMAGE_CORNERS.map(({
        corner, className, transformOrigin,
      }) => {
        const cornerItems = items.filter(item => item.corner === corner);
        if (cornerItems.length === 0) return null;
        return (
          <div
            key={corner}
            className={`
              pointer-events-none absolute flex flex-col gap-1
              ${className}
            `}
          >
            {cornerItems.map((item) => {
              const scale = isMobile ? (item.mobileScale ?? item.scale) : item.scale;
              const scaleStyle = scale !== 1
                ? {
                  transform: `scale(${scale})`,
                  transformOrigin,
                }
                : undefined;
              return (
                // The corner container is click-through (`pointer-events-none`) so the gaps between
                // badges don't block the image; each item re-enables pointer events so interactive
                // overlays (Open Link / More) remain clickable.
                <div
                  key={item.key}
                  className="pointer-events-auto"
                  style={scaleStyle}
                >
                  {item.node}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
