import type { CardFieldPlacement, CardFieldZone, CardFieldZones, CustomProperty } from "@eesimple/types";

import { useState } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CARD_FIELD_ZONES, emptyCardFieldZones, zoneToCorner } from "@eesimple/types";

import { carryOverPlacement } from "./cardFieldPlacementMove";
import i18n from "../i18n";
import { FieldChip } from "./cardFieldZoneBoard/FieldChip";
import {
  BooleanPlacementControls,
  HierarchyHoverControls,
  ImagePlacementControls,
  ProgressBodyControls,
  ProgressTextControls,
  TablePlacementControls,
  TagsPlacementControls,
} from "./cardFieldZoneBoard/placementControls";
import { ZoneDropArea } from "./cardFieldZoneBoard/ZoneDropArea";
import { BODY_ZONE_DEFS, HIERARCHY_HOVER_PROP, IMAGE_ZONE_DEFS, TRAY_ID, zoneCollisionDetection } from "./cardFieldZoneBoard/zoneParts";
import { eligibleCustomCardFields, STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFieldDefs";

import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";

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
  const tLabel = useTranslatedLabel();
  const fields = [
    ...STANDARD_CARD_FIELDS.map(field => ({
      ...field,
      label: tLabel(field.label),
    })),
    ...eligibleCustomCardFields(properties),
  ];
  const labelByKey = new Map(fields.map(field => [field.key, field.label]));
  const propertyById = new Map(properties.map(property => [property.id, property]));
  /** The boolean custom property for `key`, or undefined when `key` isn't a boolean property. */
  function booleanPropertyFor(key: string): CustomProperty | undefined {
    const property = propertyById.get(key);
    return property?.type === "boolean" ? property : undefined;
  }
  /** The progress (itemInItems) custom property for `key`, or undefined when it isn't one. */
  function progressPropertyFor(key: string): CustomProperty | undefined {
    const property = propertyById.get(key);
    return property?.type === "itemInItems" ? property : undefined;
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
      const placement = carryOverPlacement(key, existing, zoneToCorner(targetZone) !== null);
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
      collisionDetection={zoneCollisionDetection}
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
              {(value[def.zone] ?? []).map((placement) => {
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
                    <ImagePlacementControls
                      placement={placement}
                      idPrefix={chipIdPrefix}
                      onPatch={onPatch}
                    />
                    {progressPropertyFor(placement.key)
                      ? (
                        <ProgressTextControls
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
                    : placement.key === "tags"
                      ? (
                        <TagsPlacementControls
                          zone={def.zone}
                          placement={placement}
                          idPrefix={chipIdPrefix}
                          onPatch={onPatch}
                        />
                      )
                      : HIERARCHY_HOVER_PROP[placement.key]
                        ? (
                          <HierarchyHoverControls
                            zone={def.zone}
                            fieldKey={placement.key}
                            placement={placement}
                            idPrefix={chipIdPrefix}
                            onPatch={onPatch}
                          />
                        )
                        : progressPropertyFor(placement.key)
                          ? (
                            <ProgressBodyControls
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
          label={i18n.t("Available (hidden)")}
          highlight={overZone === "tray"}
          items={unplaced.map(field => field.key)}
        >
          {unplaced.length === 0
            ? <p className="text-xs text-muted-foreground">{i18n.t("All fields are placed.")}</p>
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
