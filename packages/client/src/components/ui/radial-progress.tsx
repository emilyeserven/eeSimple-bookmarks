import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RadialProgressProps {
  /** Current value (numerator). Clamped to `0…max`. */
  value: number;
  /** Top of the scale (denominator). Values `<= 0` render an empty ring. Defaults to 100. */
  max?: number;
  /** Diameter in pixels. Defaults to 40. */
  size?: number;
  /** Ring thickness in pixels. Defaults to ~1/8 of `size`. */
  strokeWidth?: number;
  /** Accessible label for the progressbar. Defaults to "Progress". */
  label?: string;
  /** Optional content centered inside the ring (e.g. a percentage). */
  children?: ReactNode;
  className?: string;
}

/**
 * A circular progress ring drawn as SVG: a muted track under a `primary`-colored arc that fills
 * clockwise from the top by `value / max`. Theme-aware (uses the `stroke-*` design tokens, so it
 * adapts to light/dark) and accessible (`role="progressbar"` with `aria-valuenow/min/max`). Optional
 * `children` render centered inside the ring. A `0`-of-`N` value renders a valid empty (0%) ring.
 */
export function RadialProgress({
  value,
  max = 100,
  size = 40,
  strokeWidth,
  label,
  children,
  className,
}: RadialProgressProps) {
  const stroke = strokeWidth ?? Math.max(2, Math.round(size / 8));
  const fraction = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);
  const center = size / 2;
  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{
        width: size,
        height: size,
      }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={Math.max(max, 0)}
      aria-label={label ?? "Progress"}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted-foreground/25"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="stroke-primary transition-[stroke-dashoffset]"
        />
      </svg>
      {children == null
        ? null
        : (
          <span className="absolute inset-0 flex items-center justify-center">
            {children}
          </span>
        )}
    </div>
  );
}
