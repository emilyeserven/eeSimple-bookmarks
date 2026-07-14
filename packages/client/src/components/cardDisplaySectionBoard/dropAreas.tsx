import type { MoveTargetList } from "./boardParts";
import type { CardFieldTarget } from "../../lib/cardDisplaySectionMutations";
import type { CardFieldPlacement, CardImageCorner } from "@eesimple/types";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";

import { CORNER_LABELS, TRAY_ID } from "./boardParts";
import { FieldChip } from "./FieldChip";

import { Label } from "@/components/ui/label";

export function CornerDropArea({
  corner, fields, labelFor, progressKeys, moveTargets, onMoveField, onToggleHideLabel, onPatchField,
}: {
  corner: CardImageCorner;
  fields: { key: string;
    hideLabel?: boolean;
    showProgressCount?: boolean;
    showProgressUnit?: boolean; }[];
  labelFor: (key: string) => string;
  progressKeys: Set<string>;
  moveTargets: MoveTargetList[];
  onMoveField: (fieldKey: string, target: CardFieldTarget) => void;
  onToggleHideLabel: (fieldKey: string, on: boolean) => void;
  onPatchField: (fieldKey: string, patch: Partial<CardFieldPlacement>) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    setNodeRef, isOver,
  } = useDroppable({
    id: `corner:${corner}`,
  });
  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-16 rounded-md border border-dashed p-2
        ${isOver
      ? "border-primary bg-primary/5"
      : "border-input"}
      `}
    >
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">{t(CORNER_LABELS[corner])}</p>
      <SortableContext
        items={fields.map(f => `field:${f.key}`)}
        strategy={rectSortingStrategy}
      >
        <div className="flex flex-wrap gap-1">
          {fields.map(field => (
            <FieldChip
              key={field.key}
              fieldKey={field.key}
              label={labelFor(field.key)}
              hideLabel={field.hideLabel ?? false}
              progressCount={field.showProgressCount ?? true}
              progressUnit={field.showProgressUnit ?? true}
              idPrefix={`corner-${corner}`}
              moveTargets={moveTargets}
              onMove={target => onMoveField(field.key, target)}
              onToggleHideLabel={on => onToggleHideLabel(field.key, on)}
              onToggleProgressCount={progressKeys.has(field.key)
                ? on => onPatchField(field.key, {
                  showProgressCount: on,
                })
                : undefined}
              onToggleProgressUnit={progressKeys.has(field.key)
                ? on => onPatchField(field.key, {
                  showProgressUnit: on,
                })
                : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function TrayDropArea({
  trayKeys, labelFor, moveTargets, onMoveField,
}: {
  trayKeys: string[];
  labelFor: (key: string) => string;
  moveTargets: MoveTargetList[];
  onMoveField: (fieldKey: string, target: CardFieldTarget) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    setNodeRef, isOver,
  } = useDroppable({
    id: TRAY_ID,
  });
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{t("Available (hidden)")}</Label>
      <p className="text-xs text-muted-foreground">
        {t("Fields left here are hidden on cards. Drag one into a section or corner to show it.")}
      </p>
      <div
        ref={setNodeRef}
        className={`
          min-h-12 rounded-md border border-dashed p-2
          ${isOver
      ? "border-primary bg-primary/5"
      : "border-input"}
        `}
      >
        <SortableContext
          items={trayKeys.map(key => `field:${key}`)}
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap gap-1.5">
            {trayKeys.map(key => (
              <FieldChip
                key={key}
                fieldKey={key}
                label={labelFor(key)}
                hideLabel={false}
                idPrefix="tray"
                moveTargets={moveTargets}
                onMove={target => onMoveField(key, target)}
                onToggleHideLabel={() => undefined}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
