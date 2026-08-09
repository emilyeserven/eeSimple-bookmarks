import { cn } from "@/lib/utils";

export interface MergeFieldOption {
  memberId: string;
  /** Display value, or `null` for an empty value (rendered as an em dash). */
  display: string | null;
}

/**
 * One picker row in the merge review dialog: the unit label over one clickable value cell per
 * group member — the selected cell's value wins the merge.
 */
export function MergeFieldRow({
  label,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  options: MergeFieldOption[];
  selectedId: string;
  onSelect: (memberId: string) => void;
}) {
  return (
    <div className="py-2">
      <div className="text-sm font-medium">{label}</div>
      <div
        className="mt-1 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map(option => (
          <button
            key={option.memberId}
            type="button"
            onClick={() => onSelect(option.memberId)}
            aria-pressed={option.memberId === selectedId}
            className={cn(
              `
                min-w-0 rounded-md border p-2 text-left text-sm wrap-break-word
                hover:bg-accent
              `,
              option.memberId === selectedId && `
                border-primary ring-1 ring-primary
              `,
              option.display === null && "text-muted-foreground",
            )}
          >
            {option.display ?? "—"}
          </button>
        ))}
      </div>
    </div>
  );
}
