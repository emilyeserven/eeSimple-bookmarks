import type { CardFieldPlacement, CardFieldZone, CardFieldZones, CustomProperty } from "@eesimple/types";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CARD_FIELD_ZONES, emptyCardFieldZones } from "@eesimple/types";
import { GripVertical } from "lucide-react";

import { eligibleCustomCardFields, STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFieldDefs";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** The droppable target ids for the tray of unplaced (hidden) fields. */
const TRAY_ID = "zone-tray";

/** The 5 zones in display order (image corners first, then the card body). */
const ZONE_DEFS: { zone: CardFieldZone;
  label: string;
  isImage: boolean; }[] = [
  {
    zone: "image-top-left",
    label: "Image top-left",
    isImage: true,
  },
  {
    zone: "image-top-right",
    label: "Image top-right",
    isImage: true,
  },
  {
    zone: "image-bottom-left",
    label: "Image bottom-left",
    isImage: true,
  },
  {
    zone: "image-bottom-right",
    label: "Image bottom-right",
    isImage: true,
  },
  {
    zone: "card",
    label: "Card",
    isImage: false,
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
 * The drag-and-drop board for a card display rule's field placement: drag each field (standard field
 * or custom property) onto one of the four image corners, the card body, or the "Available" tray (=
 * hidden). Fields placed in an image corner expose overlay size / mobile size / hide-label controls.
 */
export function CardFieldZoneBoard({
  value, onChange, properties, idPrefix,
}: CardFieldZoneBoardProps) {
  const fields = [...STANDARD_CARD_FIELDS, ...eligibleCustomCardFields(properties)];
  const labelByKey = new Map(fields.map(field => [field.key, field.label]));
  const placedKeys = new Set(CARD_FIELD_ZONES.flatMap(zone => value[zone].map(p => p.key)));
  const unplaced = fields.filter(field => !placedKeys.has(field.key));

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  /** Move `key` to `targetZone` (or the tray when `null`), preserving image styling across image zones. */
  function moveKey(key: string, targetZone: CardFieldZone | null): void {
    let existing: CardFieldPlacement | undefined;
    const next = emptyCardFieldZones();
    for (const zone of CARD_FIELD_ZONES) {
      next[zone] = value[zone].filter((placement) => {
        if (placement.key === key) {
          existing = placement;
          return false;
        }
        return true;
      });
    }
    if (targetZone) {
      const placement: CardFieldPlacement = targetZone === "card"
        ? {
          key,
        }
        : {
          key,
          scale: existing?.scale,
          mobileScale: existing?.mobileScale,
          hideLabel: existing?.hideLabel,
        };
      next[targetZone] = [...next[targetZone], placement];
    }
    onChange(next);
  }

  /** Patch the placement for `key` within image `zone` (size / mobile size / hide-label). */
  function patchPlacement(zone: CardFieldZone, key: string, patch: Partial<CardFieldPlacement>): void {
    const next = emptyCardFieldZones();
    for (const z of CARD_FIELD_ZONES) {
      next[z] = value[z].map(placement => (z === zone && placement.key === key
        ? {
          ...placement,
          ...patch,
        }
        : placement));
    }
    onChange(next);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={({
        active, over,
      }) => {
        if (!over) return;
        const key = String(active.id);
        const overId = String(over.id);
        if (overId === TRAY_ID) {
          moveKey(key, null);
          return;
        }
        const zone = ZONE_DEFS.find(z => `zone-${z.zone}` === overId)?.zone;
        if (zone) moveKey(key, zone);
      }}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {ZONE_DEFS.map(def => (
            <ZoneDropArea
              key={def.zone}
              id={`zone-${def.zone}`}
              label={def.label}
              className={def.zone === "card" ? "col-span-2" : undefined}
            >
              {value[def.zone].length === 0
                ? <p className="text-xs text-muted-foreground">Drop fields here</p>
                : value[def.zone].map(placement => (
                  <FieldChip
                    key={placement.key}
                    fieldKey={placement.key}
                    label={labelByKey.get(placement.key) ?? placement.key}
                    idPrefix={idPrefix}
                  >
                    {def.isImage
                      ? (
                        <ImagePlacementControls
                          placement={placement}
                          idPrefix={`${idPrefix}-${def.zone}-${placement.key}`}
                          onPatch={patch => patchPlacement(def.zone, placement.key, patch)}
                        />
                      )
                      : null}
                  </FieldChip>
                ))}
            </ZoneDropArea>
          ))}
        </div>

        <ZoneDropArea
          id={TRAY_ID}
          label="Available (hidden)"
        >
          {unplaced.length === 0
            ? <p className="text-xs text-muted-foreground">All fields are placed.</p>
            : unplaced.map(field => (
              <FieldChip
                key={field.key}
                fieldKey={field.key}
                label={field.label}
                idPrefix={idPrefix}
              />
            ))}
        </ZoneDropArea>
      </div>
    </DndContext>
  );
}

interface ZoneDropAreaProps {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}

/** A labeled droppable zone that highlights while a field is dragged over it. */
function ZoneDropArea({
  id, label, className, children,
}: ZoneDropAreaProps) {
  const {
    setNodeRef, isOver,
  } = useDroppable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-md border border-dashed p-2
        ${isOver ? "border-primary bg-accent" : "border-input"}
        ${className ?? ""}
      `}
    >
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

interface FieldChipProps {
  fieldKey: string;
  label: string;
  idPrefix: string;
  children?: React.ReactNode;
}

/** A draggable field chip; renders any image-placement controls passed as children. */
function FieldChip({
  fieldKey, label, children,
}: FieldChipProps) {
  const {
    attributes, listeners, setNodeRef, isDragging,
  } = useDraggable({
    id: fieldKey,
  });
  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col gap-1 rounded-md border bg-card px-2 py-1 text-sm
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground"
          aria-label={`Drag ${label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

interface ImagePlacementControlsProps {
  placement: CardFieldPlacement;
  idPrefix: string;
  onPatch: (patch: Partial<CardFieldPlacement>) => void;
}

/** Overlay size / mobile size / hide-label controls for a field placed in an image corner. */
function ImagePlacementControls({
  placement, idPrefix, onPatch,
}: ImagePlacementControlsProps) {
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
          id={`${idPrefix}-hide-label`}
          checked={placement.hideLabel ?? false}
          onCheckedChange={checked => onPatch({
            hideLabel: checked === true,
          })}
        />
        Hide label
      </label>
    </div>
  );
}
