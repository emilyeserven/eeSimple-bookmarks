import type { StarRatingProps } from "./StarRating";
import type { RatingDisplay } from "@eesimple/types";

import { RatingTicks } from "./RatingTicks";
import { StarRating } from "./StarRating";

/**
 * Renders a rating value in the property's configured display style — `StarRating` (stars) or
 * `RatingTicks` (tick-mark scale). A drop-in for the star/tick call sites: pass the property's
 * `ratingDisplay` (null → stars) plus the usual StarRating props.
 */
export function RatingValue({
  display, ...props
}: { display: RatingDisplay | null | undefined } & StarRatingProps) {
  return display === "ticks" ? <RatingTicks {...props} /> : <StarRating {...props} />;
}
