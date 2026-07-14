import type { CardFieldZone } from "@eesimple/types";

import { useState } from "react";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight } from "lucide-react";

import i18n from "../../i18n";

interface ZoneDropAreaProps {
  /** A {@link CardFieldZone} or the literal `"tray"` (unplaced fields). */
  zone: CardFieldZone | "tray";
  label: string;
  hint?: string;
  /** Highlight this zone as the active drop target (tracked by the board across child-chip hovers). */
  highlight?: boolean;
  /** The field keys this zone holds, in order — the ids the SortableContext reorders. */
  items: string[];
  children: React.ReactNode;
}

/**
 * A labeled droppable + sortable zone that highlights while a field is dragged over it. The header is a
 * collapse toggle; when collapsed the chip list is hidden but the droppable container stays mounted so
 * a field can still be dropped onto it.
 */
export function ZoneDropArea({
  zone, label, hint, highlight = false, items, children,
}: ZoneDropAreaProps) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    setNodeRef, isOver,
  } = useDroppable({
    id: `zone-${zone}`,
  });
  const count = items.length;
  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-md border border-dashed p-2
        ${isOver || highlight ? "border-primary bg-accent" : "border-input"}
      `}
    >
      <button
        type="button"
        className="flex w-full items-center gap-1 text-left"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(prev => !prev)}
      >
        {collapsed
          ? <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          : <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {collapsed && count > 0
          ? <span className="text-[11px] text-muted-foreground/80">({count})</span>
          : null}
      </button>
      {collapsed
        ? null
        : (
          <>
            {hint
              ? <p className="mt-0.5 mb-1 text-[11px] text-muted-foreground/80">{hint}</p>
              : <div className="mb-1" />}
            <SortableContext items={items}>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(children) ? children.length === 0 : !children)
                  ? <p className="text-xs text-muted-foreground">{i18n.t("Drop fields here")}</p>
                  : children}
              </div>
            </SortableContext>
          </>
        )}
    </div>
  );
}
