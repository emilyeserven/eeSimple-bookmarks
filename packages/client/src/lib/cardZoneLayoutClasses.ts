import type {
  CardFieldZone,
  CardSectionForm,
  CardZoneAlign,
  CardZoneDirection,
  CardZoneGap,
  CardZoneLayout,
  CardZoneVerticalAlign,
  CardZoneWrap,
} from "@eesimple/types";

/** The three render forms a card-body sub-zone imposes on the fields placed in it. */
export type FieldForm = "single" | "label" | "table";

/** Which render form a card-body sub-zone imposes (Labels → pills, Table → grid, else stacked rows). */
export function zoneForm(zone: CardFieldZone): FieldForm {
  if (zone === "card-labels") return "label";
  if (zone === "card-table") return "table";
  return "single";
}

/** Map a dynamic-section {@link CardSectionForm} to the render {@link FieldForm} (inline → label, stacked → single). */
export function sectionFormToFieldForm(form: CardSectionForm): FieldForm {
  if (form === "inline") return "label";
  if (form === "table") return "table";
  return "single";
}

// Static Tailwind class maps for the per-zone gap/alignment knobs. These must be whole literal class
// strings (not interpolated) so Tailwind's content scanner keeps them.
const GAP_CLASS: Record<CardZoneGap, string> = {
  sm: "gap-1",
  md: "gap-2",
  lg: "gap-4",
};
const ALIGN_JUSTIFY: Record<CardZoneAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};
const ALIGN_ITEMS: Record<CardZoneVerticalAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};
const DIRECTION_CLASS: Record<CardZoneDirection, string> = {
  row: "flex-row",
  column: "flex-col",
};
const WRAP_CLASS: Record<CardZoneWrap, string> = {
  wrap: "flex-wrap",
  nowrap: "flex-nowrap",
};

/** The gap utility class for a zone's resolved layout (defaults to `md`). */
export function gapClass(layout: CardZoneLayout): string {
  return GAP_CLASS[layout.gap ?? "md"];
}

/** The flex main-axis justification class for a zone's resolved layout (defaults to `start`). */
export function justifyClass(layout: CardZoneLayout): string {
  return ALIGN_JUSTIFY[layout.align ?? "start"];
}

/**
 * The cross-axis `items-*` class for a zone's resolved layout. `fallback` is the prior hard-coded
 * default for that container (e.g. `center` for the row zones) so an unset `alignItems` keeps today's look.
 */
export function alignItemsClass(layout: CardZoneLayout, fallback: CardZoneVerticalAlign): string {
  return ALIGN_ITEMS[layout.alignItems ?? fallback];
}

/**
 * The flex direction + wrap classes for a zone's resolved layout. `fallbackDirection` is the prior
 * hard-coded direction for that container (`row` for the label/table zones, `column` for the
 * single-column zones) so an unset `direction` keeps today's look.
 */
export function flexFlowClass(layout: CardZoneLayout, fallbackDirection: CardZoneDirection = "row"): string {
  return `${DIRECTION_CLASS[layout.direction ?? fallbackDirection]} ${WRAP_CLASS[layout.wrap ?? "wrap"]}`;
}

/**
 * The container className a card-body zone applies to the fields it lays out, resolved from its Flex/Grid
 * layout. Shared by the real card ({@link BookmarkCardDetails}) and the settings preview
 * ({@link CardZoneLayoutPreview}) so the preview can never drift from actual rendering.
 *
 * The per-form fallbacks reproduce the pre-layout hard-coded look: the **label** zone flows as a wrap
 * row cross-aligned `center`; the **single** zones stack (`column`) cross-aligned `stretch`. Grid mode
 * is a fixed two-column grid in both.
 */
export function cardBodyContainerClass(form: "single" | "label", layout: CardZoneLayout): string {
  if (form === "label") {
    return layout.mode === "grid"
      ? `grid grid-cols-2 ${alignItemsClass(layout, "center")} ${gapClass(layout)}`
      : `flex ${flexFlowClass(layout)} ${alignItemsClass(layout, "center")} ${gapClass(layout)} ${justifyClass(layout)}`;
  }
  return layout.mode === "grid"
    ? `grid grid-cols-2 ${alignItemsClass(layout, "stretch")} ${gapClass(layout)}`
    : `flex ${flexFlowClass(layout, "column")} ${alignItemsClass(layout, "stretch")} ${justifyClass(layout)} ${gapClass(layout)}`;
}
