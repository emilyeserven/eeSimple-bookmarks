import { useState } from "react";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** Current rating (0…max, may be a half like 3.5). */
  value: number;
  /** Top of the scale (e.g. 3 or 5). */
  max: number;
  /** Allow half-star (0.5) steps when interactive. */
  allowHalf?: boolean;
  /** Allow clearing back to 0 by re-clicking the current value. Only relevant when interactive. */
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
  value, max, allowHalf = false, allowZero = false, readOnly = false,
  onChange, label, size = 18, className,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

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
        // Fraction of this star that is filled (0, 0.5, or 1).
        const fill = Math.max(0, Math.min(1, display - index));
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
                      aria-label={`Rate ${position - 0.5} of ${max}`}
                      className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                      onMouseEnter={() => setHover(position - 0.5)}
                      onClick={() => commit(position - 0.5)}
                    />
                    <button
                      type="button"
                      aria-label={`Rate ${position} of ${max}`}
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
                    aria-label={`Rate ${position} of ${max}`}
                    className="absolute inset-0 cursor-pointer"
                    onMouseEnter={() => setHover(position)}
                    onClick={() => commit(position)}
                  />
                )}
          </span>
        );
      })}
      {label ? <span className="ml-1.5 text-xs text-muted-foreground">{label}</span> : null}
    </span>
  );
}
