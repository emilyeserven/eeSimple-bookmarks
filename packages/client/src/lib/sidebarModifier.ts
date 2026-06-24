import type { SidebarOpenModifier } from "@/stores/uiStore";

/** Maps each configurable modifier to the corresponding DOM mouse-event flag. */
const FLAG = {
  alt: "altKey",
  ctrl: "ctrlKey",
  shift: "shiftKey",
  meta: "metaKey",
} as const;

/** A mouse event's modifier flags — the subset we read to decide where an Edit click lands. */
type ModifierFlags = Pick<MouseEvent, "altKey" | "ctrlKey" | "shiftKey" | "metaKey">;

/** True when the configured modifier key is held during a mouse event. */
export function hasSidebarModifier(event: ModifierFlags, modifier: SidebarOpenModifier): boolean {
  return event[FLAG[modifier]];
}

/** Human-readable labels for the modifier picker in Settings. */
export const SIDEBAR_MODIFIER_LABELS: Record<SidebarOpenModifier, string> = {
  alt: "Alt / Option",
  ctrl: "Ctrl",
  shift: "Shift",
  meta: "Cmd / Meta",
};

/** Tooltip title for an entity link that supports Cmd, Shift, and the configured sidebar modifier. */
export function entityLinkTitle(modifier: SidebarOpenModifier): string {
  return `Open · Shift: edit · ${SIDEBAR_MODIFIER_LABELS[modifier]}: sidebar`;
}
