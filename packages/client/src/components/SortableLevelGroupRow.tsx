import type { GroupRowProps } from "./levelGroupRowTypes";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { LevelGroupRowContent } from "./LevelGroupRowContent";

import { cn } from "@/lib/utils";

/** A single drag-sortable level-group card: name + visibility + pin/area + place-type assignment. */
export function SortableGroupRow(props: GroupRowProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: props.group.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "space-y-3 rounded-lg border bg-card p-3",
        isDragging && "opacity-60",
      )}
    >
      <LevelGroupRowContent
        {...props}
        attributes={attributes}
        listeners={listeners}
      />
    </div>
  );
}
