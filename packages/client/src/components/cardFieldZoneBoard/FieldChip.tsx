import type { CardFieldZone } from "@eesimple/types";

import { useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Move, SlidersHorizontal } from "lucide-react";

import { MOVE_TARGETS } from "./zoneParts";
import i18n from "../../i18n";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FieldChipProps {
  fieldKey: string;
  label: string;
  /** Send this chip's field to a zone (or the tray when `null`) from the "Move to…" menu. */
  onMoveTo: (zone: CardFieldZone | null) => void;
  children?: React.ReactNode;
}

/** Stop a pointer-down on an interactive control from starting a chip drag. */
const stopDrag = (event: React.PointerEvent) => event.stopPropagation();

/**
 * A draggable, sortable field chip. The whole chip is a drag handle (a tap on an inner control never
 * crosses the sensor's distance threshold); a "Move to…" menu offers tap-to-assign for touch. Any
 * per-zone placement controls passed as children are collapsible (collapsed by default).
 */
export function FieldChip({
  fieldKey, label, onMoveTo, children,
}: FieldChipProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: fieldKey,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={`
        flex cursor-grab touch-none flex-col gap-1 rounded-md border bg-card
        px-2 py-1 text-sm
        ${isDragging ? "opacity-50" : ""}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1.5">
        <GripVertical
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="min-w-0 flex-1">{label}</span>
        {children
          ? (
            <button
              type="button"
              className="shrink-0 text-muted-foreground"
              aria-label={optionsOpen
                ? i18n.t("Hide {{label}} options", {
                  label,
                })
                : i18n.t("Show {{label}} options", {
                  label,
                })}
              aria-expanded={optionsOpen}
              onPointerDown={stopDrag}
              onClick={() => setOptionsOpen(prev => !prev)}
            >
              {optionsOpen
                ? <ChevronDown className="size-3.5" />
                : <SlidersHorizontal className="size-3.5" />}
            </button>
          )
          : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="shrink-0 text-muted-foreground"
              aria-label={i18n.t("Move {{label}} to…", {
                label,
              })}
              onPointerDown={stopDrag}
            >
              <Move className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{i18n.t("Move to…")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MOVE_TARGETS.map(target => (
              <DropdownMenuItem
                key={target.label}
                onSelect={() => onMoveTo(target.zone)}
              >
                {target.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {children && optionsOpen
        ? <div onPointerDown={stopDrag}>{children}</div>
        : null}
    </div>
  );
}
