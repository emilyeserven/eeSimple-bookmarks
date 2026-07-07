import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Info, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type FilterMode = "default" | "on-demand";

/** One configurable filter shown as a draggable row in Settings → Display → Filters. */
export interface FilterConfigRow {
  key: string;
  label: string;
  /** A hover hint describing the data condition under which this filter appears. */
  hint: string;
}

interface SortableFilterRowProps {
  row: FilterConfigRow;
  /** Whether this filter is currently configured as on-demand (hidden until added). */
  onDemand: boolean;
  onSetMode: (key: string, mode: FilterMode) => void;
  /** Whether this filter is hidden by default on mobile. */
  mobileHidden: boolean;
  onToggleMobile: (key: string, hidden: boolean) => void;
}

/**
 * A single sortable filter row: a drag handle, the filter label with a hover-info hint about when it
 * appears, the Default / On demand toggle, and a "Hide on mobile" toggle. Mirrors
 * `HomepageWidgetOrderList`'s `SortableWidgetRow` recipe.
 */
export function SortableFilterRow({
  row, onDemand, onSetMode, mobileHidden, onToggleMobile,
}: SortableFilterRowProps) {
  const {
    t,
  } = useTranslation();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: row.key,
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
        flex items-center gap-2 rounded-md border bg-card px-3 py-2
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

      <span className="truncate text-sm">{row.label}</span>

      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="
              text-muted-foreground
              hover:text-foreground
            "
            aria-label={t("When does this filter appear?")}
          >
            <Info className="size-3.5" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-auto max-w-xs text-sm"
        >
          {row.hint}
        </HoverCardContent>
      </HoverCard>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ToggleGroup
          type="single"
          size="sm"
          value={onDemand ? "on-demand" : "default"}
          onValueChange={value => value && onSetMode(row.key, value as FilterMode)}
        >
          <ToggleGroupItem value="default">{t("Default")}</ToggleGroupItem>
          <ToggleGroupItem value="on-demand">{t("On demand")}</ToggleGroupItem>
        </ToggleGroup>

        <Toggle
          size="sm"
          variant="outline"
          pressed={mobileHidden}
          onPressedChange={pressed => onToggleMobile(row.key, pressed)}
          aria-label={t("Hide by default on mobile")}
          title={t("Hide by default on mobile")}
        >
          <Smartphone className="size-3.5" />
        </Toggle>
      </div>
    </div>
  );
}
