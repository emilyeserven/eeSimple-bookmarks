import type { BookmarkValueItem } from "../lib/bookmarkCardValues";

import { StarRating } from "./StarRating";
import { useIsMobile } from "../hooks/use-mobile";
import { CARD_IMAGE_CORNERS } from "../lib/bookmarkCardValues";

import { Badge } from "@/components/ui/badge";

interface CardImageOverlaysProps {
  /** Value items whose property has a non-null `corner`. Grouped by corner and positioned over the image. */
  items: BookmarkValueItem[];
}

/**
 * Renders custom-property value items overlaid in the corners of a bookmark card's image. Expects its
 * parent to be `position: relative`. Each corner stacks its items vertically; badges use a translucent
 * background for legibility over the image, and rating-scale values render compact stars.
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
              // Enlarge the overlay up to 2x, anchored at its corner so it grows inward. On mobile
              // the property's mobile scale takes over when set, otherwise the desktop scale applies.
              const desktopScale = item.property.cardImageCornerScale ?? 1;
              const scale = isMobile
                ? (item.property.cardImageCornerMobileScale ?? desktopScale)
                : desktopScale;
              const scaleStyle = scale !== 1
                ? {
                  transform: `scale(${scale})`,
                  transformOrigin,
                }
                : undefined;
              return item.kind === "rating"
                ? (
                  <div
                    key={item.id}
                    className="
                      rounded-md bg-background/85 px-1.5 py-0.5 backdrop-blur-sm
                    "
                    style={scaleStyle}
                  >
                    <StarRating
                      value={item.value}
                      max={item.property.ratingMax ?? 5}
                      allowHalf={item.property.ratingAllowHalf}
                      allowZero={item.property.ratingAllowZero}
                      readOnly
                      size={12}
                    />
                  </div>
                )
                : (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="bg-background/85 backdrop-blur-sm"
                    style={scaleStyle}
                  >
                    {item.label}
                  </Badge>
                );
            })}
          </div>
        );
      })}
    </>
  );
}
