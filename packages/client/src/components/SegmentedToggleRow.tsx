import type React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SegmentedToggleRowOption<V extends string> {
  value: V;
  label: string;
}

interface SegmentedToggleRowProps<V extends string> {
  /** The row's left-side label text. */
  label: string;
  /**
   * Optional icon rendered before the label. Takes a pre-rendered node (not a component
   * reference) so callers stay in control of the icon's own props (e.g. `CategoryIcon`'s
   * required `name`) and identity across renders.
   */
  icon?: React.ReactNode;
  /** Optional muted helper line rendered under the label. */
  hint?: string;
  /** The mutually-exclusive options rendered as a joined segmented ToggleGroup (2 or more). */
  options: readonly SegmentedToggleRowOption<V>[];
  value: V;
  onChange: (value: V) => void;
}

/**
 * Returns the joined-segment classes for the option at `index` of `count` — first/middle/last —
 * so the group reads as one pill instead of separate buttons (adjoining borders collapsed via
 * `-me-px`, only the group's outer corners rounded, and the currently-focused segment lifted
 * above its neighbors via `focus-visible:z-10` so its full outline is visible).
 */
function segmentClassName(index: number, count: number): string {
  const isFirst = index === 0;
  const isLast = index === count - 1;
  if (isFirst && isLast) return "focus-visible:z-10";
  if (isFirst) return "-me-px rounded-e-none focus-visible:z-10";
  if (isLast) return "rounded-s-none focus-visible:z-10";
  return "-me-px rounded-none focus-visible:z-10";
}

/**
 * A label (+ optional icon/hint) paired with a joined segmented single-select `ToggleGroup`.
 * Carries, in one place, the joined-segment styling PR #919 copy-pasted into
 * `SidebarItemsCard.tsx` (`SidebarItemsMatrix`):
 * `variant="outline"`, `size="sm"`, `className="gap-0"` on the group, and per-item
 * `-me-px rounded-e-none` / `-me-px rounded-none` / `rounded-s-none`, each with
 * `focus-visible:z-10`. Any new segmented settings row should render through this rather than
 * re-copying the positional classNames.
 */
export function SegmentedToggleRow<V extends string>({
  label, icon, hint, options, value, onChange,
}: SegmentedToggleRowProps<V>) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5 truncate text-sm">
        {icon}
        {hint
          ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{label}</span>
              <span className="truncate text-xs text-muted-foreground">{hint}</span>
            </span>
          )
          : label}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        className="gap-0"
        value={value}
        onValueChange={next => next && onChange(next as V)}
      >
        {options.map((option, index) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={segmentClassName(index, options.length)}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
