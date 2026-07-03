import type { SyncFieldDiff } from "@/lib/syncSources/syncSourceTypes";

import { Checkbox } from "@/components/ui/checkbox";

/** Renders a value cell, showing an em dash for an empty/null value. */
function displayValue(value: string | number | null): string {
  if (value === null || value === "") return "—";
  return String(value);
}

/**
 * One text field-diff row in the sync modal: a checkbox plus the field label and a Current | New
 * two-column comparison. Clicking anywhere in the row toggles the checkbox (it's a `<label>`).
 */
export function SyncDiffRow({
  row, checked, onToggle,
}: {
  row: SyncFieldDiff;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-start gap-3 py-2"
    >
      <Checkbox
        checked={checked}
        onCheckedChange={value => onToggle(value === true)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{row.label}</div>
        <div
          className="mt-1 grid grid-cols-2 gap-3 text-sm"
        >
          <div className="min-w-0">
            <div
              className="
                text-[10px] tracking-wide text-muted-foreground uppercase
              "
            >
              Current
            </div>
            <div className="wrap-break-word text-muted-foreground">{displayValue(row.current)}</div>
          </div>
          <div className="min-w-0">
            <div
              className="
                text-[10px] tracking-wide text-muted-foreground uppercase
              "
            >
              New
            </div>
            <div className="wrap-break-word">{displayValue(row.next)}</div>
          </div>
        </div>
      </div>
    </label>
  );
}
