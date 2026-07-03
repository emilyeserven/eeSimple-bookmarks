import type { SyncFieldDiff } from "@/lib/syncSources/syncSourceTypes";

import { ImageOff } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

/** A thumbnail preview cell — the image, or an "no image" placeholder when the URL is absent. */
function ThumbBox({
  label, src,
}: {
  label: string;
  src: string | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <div
        className="
          mb-1 text-[10px] tracking-wide text-muted-foreground uppercase
        "
      >
        {label}
      </div>
      {src
        ? (
          <img
            src={src}
            alt={`${label} image`}
            className="size-20 rounded-md border object-cover"
          />
        )
        : (
          <div
            className="
              flex size-20 items-center justify-center rounded-md border
              border-dashed text-muted-foreground
            "
          >
            <ImageOff className="size-5" />
          </div>
        )}
    </div>
  );
}

/**
 * One image field-diff row: a checkbox plus the field label and side-by-side Current / New
 * thumbnails. Image rows apply immediately on Apply (they can't be staged into a form field), so the
 * label notes that.
 */
export function SyncImageDiffRow({
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
        <div className="text-sm font-medium">
          {row.label}
          {row.applyImmediately
            ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                applies immediately
              </span>
            )
            : null}
        </div>
        <div className="mt-1 flex items-start gap-4">
          <ThumbBox
            label="Current"
            src={row.currentThumb}
          />
          <ThumbBox
            label="New"
            src={row.nextThumb}
          />
        </div>
      </div>
    </label>
  );
}
