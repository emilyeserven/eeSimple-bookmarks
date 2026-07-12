import type { StarRatingProps } from "./StarRating";

import { useState } from "react";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ratingFillBounds } from "@/lib/ratingDisplay";
import { cn } from "@/lib/utils";

/**
 * A tick-mark rendering of a rating value — the alternative to {@link StarRating}, sharing the same
 * prop surface so it's a drop-in via `RatingValue`. Each level is a thin vertical bar; a filled bar
 * is amber, an empty one muted. Read-only mode shows a static fill / range band (via the shared
 * {@link ratingFillBounds}); interactive mode lets the user click a bar to set a single value
 * (hover preview + clear-to-0), mirroring StarRating. Range editing is handled by the From/To
 * dropdowns elsewhere, so interactive ticks only set a single level.
 */
export function RatingTicks({
  value, max, rangeEnd = null, rangeIncludeStart = false, allowZero = false,
  readOnly = false, onChange, label, size = 18, className,
}: StarRatingProps) {
  const {
    t,
  } = useTranslation();
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  const {
    bandStart, bandEnd,
  } = ratingFillBounds({
    display,
    value,
    rangeEnd,
    readOnly,
    rangeIncludeStart,
  });
  // A tick bar is roughly a third as wide as it is tall; the row height tracks `size` like StarRating.
  const barWidth = Math.max(3, Math.round(size / 3));

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({
        length: max,
      }, (_, index) => {
        const position = index + 1;
        // Fraction of this tick filled: overlap of its cell (index, index+1] with [bandStart, bandEnd].
        const fill = Math.max(0, Math.min(index + 1, bandEnd) - Math.max(index, bandStart));
        return (
          <span
            key={position}
            className="relative inline-block"
            style={{
              width: barWidth,
              height: size,
            }}
          >
            <span className="absolute inset-0 rounded-sm bg-muted-foreground/30" />
            {fill > 0
              ? (
                <span
                  className="
                    absolute inset-y-0 left-0 overflow-hidden rounded-sm
                    bg-amber-400
                  "
                  style={{
                    width: `${fill * 100}%`,
                  }}
                />
              )
              : null}
            {readOnly
              ? null
              : (
                <button
                  type="button"
                  aria-label={t("Rate {{value}} of {{max}}", {
                    value: position,
                    max,
                  })}
                  className="absolute inset-0 cursor-pointer"
                  onMouseEnter={() => setHover(position)}
                  onClick={() => {
                    if (!onChange) return;
                    onChange(allowZero && position === value ? 0 : position);
                  }}
                />
              )}
          </span>
        );
      })}
      {!readOnly && allowZero && onChange
        ? (
          <button
            type="button"
            aria-label={t("Clear rating")}
            className="
              ml-1 rounded-sm text-muted-foreground
              hover:text-foreground
            "
            onClick={() => onChange(0)}
          >
            <X className="size-3.5" />
          </button>
        )
        : null}
      {label ? <span className="ml-1.5 text-xs text-muted-foreground">{label}</span> : null}
    </span>
  );
}
