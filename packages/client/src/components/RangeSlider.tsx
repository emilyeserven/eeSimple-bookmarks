import * as React from "react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface RangeSliderProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value: [number, number];
  onValueChange: (range: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

/**
 * Dual-thumb numeric range built on the shadcn `Slider` (Radix). Keeps a min–max
 * readout above the track; thumbs are clamped by Radix so they can't cross.
 */
export function RangeSlider({
  value, onValueChange, min = 0, max = 100, step = 1, label, className, ...props
}: RangeSliderProps) {
  const [lo, hi] = value;
  // Guard against an empty range (min === max) which would make the track inert.
  const safeMax = max > min ? max : min + 1;

  return (
    <div
      data-slot="range-slider"
      className={cn("space-y-2", className)}
      {...props}
    >
      <div
        className="
          flex items-center justify-between text-xs text-muted-foreground
        "
      >
        <span>{label ?? "Range"}</span>
        <span className="font-medium text-foreground">
          {lo}
          {" – "}
          {hi}
        </span>
      </div>
      <Slider
        min={min}
        max={safeMax}
        step={step}
        value={[lo, hi]}
        aria-label={label}
        onValueChange={(next) => {
          const [nextLo, nextHi] = next;
          onValueChange([nextLo, nextHi]);
        }}
      />
    </div>
  );
}
