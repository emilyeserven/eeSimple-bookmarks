import type { CardFieldPlacement, CardFieldZone, CardFieldZones, CustomProperty } from "@eesimple/types";

import { useState } from "react";

import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CARD_FIELD_ZONES, emptyCardFieldZones, zoneToCorner } from "@eesimple/types";
import { ChevronDown, ChevronRight, GripVertical, Move, SlidersHorizontal } from "lucide-react";

import { eligibleCustomCardFields, STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFieldDefs";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** The droppable id for the tray of unplaced (hidden) fields. */
const TRAY_ID = "zone-tray";

/** The four image-corner zones, shown as a 2×2 grid (overlays on the card image). */
const IMAGE_ZONE_DEFS: { zone: CardFieldZone;
  label: string; }[] = [
  {
    zone: "image-top-left",
    label: "Image top-left",
  },
  {
    zone: "image-top-right",
    label: "Image top-right",
  },
  {
    zone: "image-bottom-left",
    label: "Image bottom-left",
  },
  {
    zone: "image-bottom-right",
    label: "Image bottom-right",
  },
];

/** The four card-body sub-zones, stacked full-width in the order they render on the card. */
const BODY_ZONE_DEFS: { zone: CardFieldZone;
  label: string;
  hint: string; }[] = [
  {
    zone: "card-single-top",
    label: "Single column top",
    hint: "Full-width rows above the rest of the card.",
  },
  {
    zone: "card-labels",
    label: "Labels",
    hint: "Pills and badges in their existing label form.",
  },
  {
    zone: "card-table",
    label: "Table",
    hint: "A label : value two-column table.",
  },
  {
    zone: "card-single-bottom",
    label: "Single column bottom",
    hint: "Full-width rows below the rest of the card.",
  },
];

/** Every drop target offered by a chip's "Move to…" menu: the eight zones plus the hidden tray. */
const MOVE_TARGETS: { zone: CardFieldZone | null;
  label: string; }[] = [
  ...BODY_ZONE_DEFS.map(def => ({
    zone: def.zone,
    label: def.label,
  })),
  ...IMAGE_ZONE_DEFS.map(def => ({
    zone: def.zone,
    label: def.label,
  })),
  {
    zone: null,
    label: "Available (hidden)",
  },
];

const SCALE_OPTIONS = [
  {
    value: "1",
    label: "1×",
  },
  {
    value: "1.5",
    label: "1.5×",
  },
  {
    value: "2",
    label: "2×",
  },
];

const MOBILE_SCALE_OPTIONS = [
  {
    value: "inherit",
    label: "Inherit",
  },
  ...SCALE_OPTIONS,
];

interface CardFieldZoneBoardProps {
  value: CardFieldZones;
  onChange: (zones: CardFieldZones) => void;
  properties: CustomProperty[];
  idPrefix: string;
}

/**
 * The drag-and-drop board for a card display rule's field placement. Drag each field (standard field
 * or custom property) into one of the four image corners, the four card-body sub-zones (Single column
 * top / Labels / Table / Single column bottom), or the "Available" tray (= hidden). Fields can be
 * reordered within a zone (order matters on the card). Fields in an image corner expose overlay size /
 * mobile size / hide-icon / hide-label controls; fields in the Table zone expose a hide-label control.
 */
export function CardFieldZoneBoard({
  value, onChange, properties, idPrefix,
}: CardFieldZoneBoardProps) {
  const fields = [...STANDARD_CARD_FIELDS, ...eligibleCustomCardFields(properties)];
  const labelByKey = new Map(fields.map(field => [field.key, field.label]));
  const propertyById = new Map(properties.map(property => [property.id, property]));
  /** The boolean custom property for `key`, or undefined when `key` isn't a boolean property. */
  function booleanPropertyFor(key: string): CustomProperty | undefined {
    const property = propertyById.get(key);
    return property?.type === "boolean" ? property : undefined;
  }
  const placedKeys = new Set(CARD_FIELD_ZONES.flatMap(zone => (value[zone] ?? []).map(p => p.key)));
  const unplaced = fields.filter(field => !placedKeys.has(field.key));

  // A small distance constraint lets the whole chip be a drag handle while a plain tap on an inner
  // control (checkbox / select / menu) never crosses the threshold into a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor),
  );
  // The zone currently under the dragged chip — drives the drop highlight even when the pointer is over
  // a child chip (closestCorners reports the chip, not its zone container, so `isOver` alone misses it).
  const [overZone, setOverZone] = useState<CardFieldZone | "tray" | null>(null);

  /** The zone currently holding `key`, or `null` when it sits in the tray (unplaced). */
  function zoneOfKey(key: string): CardFieldZone | null {
    for (const zone of CARD_FIELD_ZONES) {
      if ((value[zone] ?? []).some(p => p.key === key)) return zone;
    }
    return null;
  }

  /**
   * Move `key` into `targetZone` at `targetIndex` (or append when `targetIndex` is omitted), or to the
   * tray when `targetZone` is `null`. Preserves `hideLabel`/`hideIcon`, and the image overlay
   * styling (`scale`/`mobileScale`) when the destination is an image zone.
   */
  function moveKey(key: string, targetZone: CardFieldZone | null, targetIndex?: number): void {
    let existing: CardFieldPlacement | undefined;
    const next = emptyCardFieldZones();
    for (const zone of CARD_FIELD_ZONES) {
      next[zone] = (value[zone] ?? []).filter((placement) => {
        if (placement.key === key) {
          existing = placement;
          return false;
        }
        return true;
      });
    }
    if (targetZone) {
      const isImage = zoneToCorner(targetZone) !== null;
      const placement: CardFieldPlacement = {
        key,
      };
      if (isImage) {
        placement.scale = existing?.scale;
        placement.mobileScale = existing?.mobileScale;
      }
      if (existing?.hideLabel) placement.hideLabel = true;
      // hideIcon applies to image overlays and to boolean body fields (icon/stars presets), so it is
      // preserved across any move; fields that don't read it simply ignore it.
      if (existing?.hideIcon) placement.hideIcon = true;
      // Preserve the boolean per-field knobs across a move (they apply in every body zone).
      if (existing?.showIfFalse) placement.showIfFalse = true;
      if (existing?.clickableInView) placement.clickableInView = true;
      if (existing?.showLabelColon === false) placement.showLabelColon = false;
      if (existing?.showValueBeforeLabel) placement.showValueBeforeLabel = true;
      const list = next[targetZone];
      const at = targetIndex === undefined ? list.length : Math.min(Math.max(targetIndex, 0), list.length);
      list.splice(at, 0, placement);
    }
    onChange(next);
  }

  /** Patch the placement for `key` within `zone` (size / mobile size / hide-icon / hide-label). */
  function patchPlacement(zone: CardFieldZone, key: string, patch: Partial<CardFieldPlacement>): void {
    const next = emptyCardFieldZones();
    for (const z of CARD_FIELD_ZONES) {
      next[z] = (value[z] ?? []).map(placement => (z === zone && placement.key === key
        ? {
          ...placement,
          ...patch,
        }
        : placement));
    }
    onChange(next);
  }

  /** Resolve a drag-over target id to the zone (or `"tray"`) it belongs to, for the drop highlight. */
  function resolveOverZone(overId: string): CardFieldZone | "tray" | null {
    if (overId === TRAY_ID) return "tray";
    const zoneContainer = [...IMAGE_ZONE_DEFS, ...BODY_ZONE_DEFS].find(z => `zone-${z.zone}` === overId)?.zone;
    if (zoneContainer) return zoneContainer;
    // `overId` is another field chip — highlight the zone that chip sits in (or the tray when unplaced).
    return zoneOfKey(overId) ?? "tray";
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={({
        over,
      }) => setOverZone(over ? resolveOverZone(String(over.id)) : null)}
      onDragCancel={() => setOverZone(null)}
      onDragEnd={({
        active, over,
      }) => {
        setOverZone(null);
        if (!over) return;
        const key = String(active.id);
        const overId = String(over.id);
        if (overId === TRAY_ID) {
          moveKey(key, null);
          return;
        }
        // Dropped onto a zone container: append to that zone.
        const overZoneId = [...IMAGE_ZONE_DEFS, ...BODY_ZONE_DEFS].find(z => `zone-${z.zone}` === overId)?.zone;
        if (overZoneId) {
          moveKey(key, overZoneId);
          return;
        }
        // Otherwise `over` is another field chip: drop into its zone at its position.
        const targetZone = zoneOfKey(overId);
        if (!targetZone || overId === key) return;
        const withoutActive = (value[targetZone] ?? []).filter(p => p.key !== key);
        const index = withoutActive.findIndex(p => p.key === overId);
        moveKey(key, targetZone, index < 0 ? undefined : index);
      }}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {IMAGE_ZONE_DEFS.map(def => (
            <ZoneDropArea
              key={def.zone}
              zone={def.zone}
              label={def.label}
              highlight={overZone === def.zone}
              items={(value[def.zone] ?? []).map(p => p.key)}
            >
              {(value[def.zone] ?? []).map(placement => (
                <FieldChip
                  key={placement.key}
                  fieldKey={placement.key}
                  label={labelByKey.get(placement.key) ?? placement.key}
                  onMoveTo={zone => moveKey(placement.key, zone)}
                >
                  <ImagePlacementControls
                    placement={placement}
                    idPrefix={`${idPrefix}-${def.zone}-${placement.key}`}
                    onPatch={patch => patchPlacement(def.zone, placement.key, patch)}
                  />
                </FieldChip>
              ))}
            </ZoneDropArea>
          ))}
        </div>

        {BODY_ZONE_DEFS.map(def => (
          <ZoneDropArea
            key={def.zone}
            zone={def.zone}
            label={def.label}
            hint={def.hint}
            highlight={overZone === def.zone}
            items={(value[def.zone] ?? []).map(p => p.key)}
          >
            {(value[def.zone] ?? []).map((placement) => {
              const boolProperty = booleanPropertyFor(placement.key);
              const chipIdPrefix = `${idPrefix}-${def.zone}-${placement.key}`;
              const onPatch = (patch: Partial<CardFieldPlacement>) =>
                patchPlacement(def.zone, placement.key, patch);
              return (
                <FieldChip
                  key={placement.key}
                  fieldKey={placement.key}
                  label={labelByKey.get(placement.key) ?? placement.key}
                  onMoveTo={zone => moveKey(placement.key, zone)}
                >
                  {boolProperty
                    ? (
                      <BooleanPlacementControls
                        property={boolProperty}
                        placement={placement}
                        idPrefix={chipIdPrefix}
                        onPatch={onPatch}
                      />
                    )
                    : def.zone === "card-table"
                      ? (
                        <TablePlacementControls
                          placement={placement}
                          idPrefix={chipIdPrefix}
                          onPatch={onPatch}
                        />
                      )
                      : null}
                </FieldChip>
              );
            })}
          </ZoneDropArea>
        ))}

        <ZoneDropArea
          zone="tray"
          label="Available (hidden)"
          highlight={overZone === "tray"}
          items={unplaced.map(field => field.key)}
        >
          {unplaced.length === 0
            ? <p className="text-xs text-muted-foreground">All fields are placed.</p>
            : unplaced.map(field => (
              <FieldChip
                key={field.key}
                fieldKey={field.key}
                label={field.label}
                onMoveTo={zone => moveKey(field.key, zone)}
              />
            ))}
        </ZoneDropArea>
      </div>
    </DndContext>
  );
}

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
function ZoneDropArea({
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
                  ? <p className="text-xs text-muted-foreground">Drop fields here</p>
                  : children}
              </div>
            </SortableContext>
          </>
        )}
    </div>
  );
}

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
function FieldChip({
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
              aria-label={`${optionsOpen ? "Hide" : "Show"} ${label} options`}
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
              aria-label={`Move ${label} to…`}
              onPointerDown={stopDrag}
            >
              <Move className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to…</DropdownMenuLabel>
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

interface PlacementControlsProps {
  placement: CardFieldPlacement;
  idPrefix: string;
  onPatch: (patch: Partial<CardFieldPlacement>) => void;
}

/** A "Hide label" checkbox (shared by the image and table placement controls). */
function HideLabelToggle({
  placement, idPrefix, onPatch,
}: PlacementControlsProps) {
  return (
    <label className="flex items-center gap-1 text-muted-foreground">
      <Checkbox
        id={`${idPrefix}-hide-label`}
        checked={placement.hideLabel ?? false}
        onCheckedChange={checked => onPatch({
          hideLabel: checked === true,
        })}
      />
      Hide label
    </label>
  );
}

/** Hide-label control for a field placed in the card-body Table zone. */
function TablePlacementControls(props: PlacementControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pl-5 text-xs">
      <HideLabelToggle {...props} />
    </div>
  );
}

/** A labeled checkbox used by the boolean placement controls. */
function PlacementCheckbox({
  id, label, checked, onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-muted-foreground">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={value => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}

/**
 * Per-field display controls for a boolean custom property placed in a card-body zone: Hide label,
 * Show if false, and Clickable in view (plus Colon-after-label / Value-before-label for the icon-like
 * presets). These knobs moved here from the property's options page.
 */
function BooleanPlacementControls({
  property, placement, idPrefix, onPatch,
}: PlacementControlsProps & { property: CustomProperty }) {
  const isIconPreset
    = property.booleanLabelPreset === "icons" || property.booleanLabelPreset === "stars";
  return (
    <div className="flex flex-wrap items-center gap-2 pl-5 text-xs">
      <HideLabelToggle
        placement={placement}
        idPrefix={idPrefix}
        onPatch={onPatch}
      />
      <PlacementCheckbox
        id={`${idPrefix}-show-if-false`}
        label="Show if false"
        checked={placement.showIfFalse ?? false}
        onCheckedChange={showIfFalse => onPatch({
          showIfFalse,
        })}
      />
      <PlacementCheckbox
        id={`${idPrefix}-clickable`}
        label="Clickable in view"
        checked={placement.clickableInView ?? false}
        onCheckedChange={clickableInView => onPatch({
          clickableInView,
        })}
      />
      {isIconPreset
        ? (
          <>
            <PlacementCheckbox
              id={`${idPrefix}-hide-icon`}
              label="Hide icon"
              checked={placement.hideIcon ?? false}
              onCheckedChange={hideIcon => onPatch({
                hideIcon,
              })}
            />
            <PlacementCheckbox
              id={`${idPrefix}-colon`}
              label="Colon after label"
              checked={placement.showLabelColon ?? true}
              onCheckedChange={showLabelColon => onPatch({
                showLabelColon,
              })}
            />
            <PlacementCheckbox
              id={`${idPrefix}-value-before`}
              label="Value before label"
              checked={placement.showValueBeforeLabel ?? false}
              onCheckedChange={showValueBeforeLabel => onPatch({
                showValueBeforeLabel,
              })}
            />
          </>
        )
        : null}
    </div>
  );
}

/** Overlay size / mobile size / hide-icon / hide-label controls for a field placed in an image corner. */
function ImagePlacementControls({
  placement, idPrefix, onPatch,
}: PlacementControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pl-5 text-xs">
      <Select
        value={String(placement.scale ?? 1)}
        onValueChange={next => onPatch({
          scale: Number(next),
        })}
      >
        <SelectTrigger className="h-6 w-16 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCALE_OPTIONS.map(opt => (
            <SelectItem
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={placement.mobileScale == null ? "inherit" : String(placement.mobileScale)}
        onValueChange={next => onPatch({
          mobileScale: next === "inherit" ? null : Number(next),
        })}
      >
        <SelectTrigger className="h-6 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MOBILE_SCALE_OPTIONS.map(opt => (
            <SelectItem
              key={opt.value}
              value={opt.value}
            >
              {opt.value === "inherit" ? "Mobile: inherit" : `Mobile: ${opt.label}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="flex items-center gap-1 text-muted-foreground">
        <Checkbox
          id={`${idPrefix}-hide-icon`}
          checked={placement.hideIcon ?? false}
          onCheckedChange={checked => onPatch({
            hideIcon: checked === true,
          })}
        />
        Hide icon/image
      </label>
      <HideLabelToggle
        placement={placement}
        idPrefix={idPrefix}
        onPatch={onPatch}
      />
    </div>
  );
}
