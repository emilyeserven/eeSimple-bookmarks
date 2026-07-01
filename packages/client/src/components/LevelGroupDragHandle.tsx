import type { SortableHandle } from "./levelGroupRowTypes";

import { GripVertical } from "lucide-react";

/** The drag grip shared by a level group's summary and edit rows. */
export function LevelGroupDragHandle({
  label, attributes, listeners,
}: SortableHandle & { label: string }) {
  return (
    <button
      type="button"
      className="
        cursor-grab text-muted-foreground
        active:cursor-grabbing
      "
      aria-label={`Reorder ${label || "level"}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
