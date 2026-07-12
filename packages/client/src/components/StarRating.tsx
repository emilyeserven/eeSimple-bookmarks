import { useState } from "react";

import { Star, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ratingFillBounds } from "@/lib/ratingDisplay";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  /** Current rating (0…max, may be a half like 3.5). For a range, the low end (From). */
  value: number;
  /** Top of the scale (e.g. 3 or 5). */
  max: number;
  /**
   * The high end (To) of a read-only **range** rating. When set (and distinct from {@link value}),
   * the stars from `value` to `rangeEnd` render as a highlighted band (e.g. levels 2–4), instead of
   * filling from the first star. Read-only only — ignored in interactive mode.
   */
  rangeEnd?: number | null;
  /** When true, a range band fills its start level's star too (inclusive band). */
  rangeIncludeStart?: boolean;
  /** Allow half-star (0.5) steps when interactive. */
  allowHalf?: boolean;
  /**
   * Allow setting the rating to 0. When interactive, this both lets the user re-click the current
   * value to clear it and renders an explicit "Clear rating" X button after the stars. Only
   * relevant when interactive.
   */
  allowZero?: boolean;
  /** Render static stars with no interaction. */
  readOnly?: boolean;
  /** Commit a new rating. Required for interactive use. */
  onChange?: (value: number) => void;
  /** Label rendered after the stars (e.g. "out of 5"). */
  label?: string;
  /** Star size in pixels. Defaults to 18. */
  size?: number;
  className?: string;
}

/**
 * A star-rating control shared by the bookmark form, card, and quick-edit menu. Read-only mode
 * shows a static fill (supporting half stars); interactive mode supports hover preview, click to
 * set, half-step clicks (`allowHalf`), and clearing to 0 (`allowZero`).
 */
export function StarRating({
  value, max, rangeEnd = null, rangeIncludeStart = false, allowHalf = false, allowZero = false, readOnly = false,
  onChange, label, size = 18, className,
}: StarRatingProps) {
  const {
    t,
  } = useTranslation();
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  // A read-only range highlights the band [value, rangeEnd]; otherwise stars fill from the start.
  const {
    bandStart, bandEnd,
  } = ratingFillBounds({
    display,
    value,
    rangeEnd,
    readOnly,
    rangeIncludeStart,
  });

  function commit(target: number) {
    if (readOnly || !onChange) return;
    // Re-clicking the current value clears it when zero is allowed.
    const next = allowZero && target === value ? 0 : target;
    onChange(next);
  }

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({
        length: max,
      }, (_, index) => {
        const position = index + 1;
        // Fraction of this star filled: the overlap of its cell (index, index+1] with the band
        // [bandStart, bandEnd]. For a single value (bandStart 0) this reduces to `display - index`.
        const fill = Math.max(0, Math.min(index + 1, bandEnd) - Math.max(index, bandStart));
        return (
          <span
            key={position}
            className="relative inline-block"
            style={{
              width: size,
              height: size,
            }}
          >
            <Star
              className="absolute inset-0 text-muted-foreground/40"
              size={size}
            />
            {fill > 0
              ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    width: `${fill * 100}%`,
                  }}
                >
                  <Star
                    className="text-amber-400"
                    fill="currentColor"
                    size={size}
                  />
                </span>
              )
              : null}
            {readOnly
              ? null
              : allowHalf
                ? (
                  <>
                    <button
                      type="button"
                      aria-label={t("Rate {{value}} of {{max}}", {
                        value: position - 0.5,
                        max,
                      })}
                      className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                      onMouseEnter={() => setHover(position - 0.5)}
                      onClick={() => commit(position - 0.5)}
                    />
                    <button
                      type="button"
                      aria-label={t("Rate {{value}} of {{max}}", {
                        value: position,
                        max,
                      })}
                      className="
                        absolute inset-y-0 right-0 w-1/2 cursor-pointer
                      "
                      onMouseEnter={() => setHover(position)}
                      onClick={() => commit(position)}
                    />
                  </>
                )
                : (
                  <button
                    type="button"
                    aria-label={t("Rate {{value}} of {{max}}", {
                      value: position,
                      max,
                    })}
                    className="absolute inset-0 cursor-pointer"
                    onMouseEnter={() => setHover(position)}
                    onClick={() => commit(position)}
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
