import type { SortableHandle } from "./levelGroupRowTypes";

import { GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

/** The drag grip shared by a level group's summary and edit rows. */
export function LevelGroupDragHandle({
  label, attributes, listeners,
}: SortableHandle & { label: string }) {
  const {
    t,
  } = useTranslation();
  return (
    <button
      type="button"
      className="
        cursor-grab text-muted-foreground
        active:cursor-grabbing
      "
      aria-label={t("Reorder {{label}}", {
        label: label || t("level"),
      })}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
