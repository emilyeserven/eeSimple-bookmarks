import type { DragEndEvent } from "@dnd-kit/core";
import type { HomepageWidget } from "@eesimple/types";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HomepageWidgetOrderListProps {
  value: HomepageWidget[];
  onChange: (order: HomepageWidget[]) => void;
  /** Widgets currently turned off — shown with a muted "hidden" hint (still reorderable). */
  disabledWidgets?: HomepageWidget[];
}

/** Human labels for each homepage widget (translated at render time). */
function useWidgetLabels(): Record<HomepageWidget, string> {
  const {
    t,
  } = useTranslation();
  return {
    homepageText: t("Homepage Text"),
    bookmarkQuickAdd: t("Bookmark Quick Add"),
    search: t("Search from Homepage"),
  };
}

/** A single sortable widget row with a drag handle. */
function SortableWidgetRow({
  widget, label, hidden,
}: { widget: HomepageWidget;
  label: string;
  hidden: boolean; }) {
  const {
    t,
  } = useTranslation();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: widget,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm
        ${isDragging ? "opacity-60" : ""}
      `}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground"
        aria-label={t("Drag to reorder")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="font-medium">{label}</span>
      {hidden
        ? <span className="ml-auto text-xs text-muted-foreground">{t("Hidden")}</span>
        : null}
    </div>
  );
}

/**
 * A controlled drag-sortable list of the top-of-homepage widgets. Reordering calls `onChange` with
 * the new order; the parent persists it (the homepage-content settings auto-save).
 */
export function HomepageWidgetOrderList({
  value, onChange, disabledWidgets = [],
}: HomepageWidgetOrderListProps) {
  const labels = useWidgetLabels();
  const disabled = new Set(disabledWidgets);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const {
      active, over,
    } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.indexOf(active.id as HomepageWidget);
    const newIndex = value.indexOf(over.id as HomepageWidget);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={value}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {value.map(widget => (
            <SortableWidgetRow
              key={widget}
              widget={widget}
              label={labels[widget]}
              hidden={disabled.has(widget)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
