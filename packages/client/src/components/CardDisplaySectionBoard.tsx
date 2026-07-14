import type { CardDisplayFields, CardFieldTarget } from "../lib/cardDisplaySectionMutations";
import type { CardImageCorner, CustomProperty } from "@eesimple/types";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { boardCollision, CORNER_LABELS, locateField, TRAY_ID } from "./cardDisplaySectionBoard/boardParts";
import { CornerDropArea, TrayDropArea } from "./cardDisplaySectionBoard/dropAreas";
import { SectionCard } from "./cardDisplaySectionBoard/SectionCard";
import { eligibleCustomCardFields, STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFieldDefs";
import {
  addCardSection,
  CARD_IMAGE_CORNER_KEYS,
  moveCardField,
  patchFieldPlacement,
  placedFieldKeys,
} from "../lib/cardDisplaySectionMutations";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CardDisplaySectionBoardProps {
  value: CardDisplayFields;
  onChange: (next: CardDisplayFields) => void;
  properties: CustomProperty[];
  idPrefix: string;
}

/**
 * The card-display section editor: dynamic, reorderable body sections (each with its own render form /
 * layout / `visibleIf` condition), the four image-corner overlays, and a tray of hidden fields. Fields
 * are dragged (or moved via the "Move to…" menu) between sections, corners, and the tray. Modeled on
 * the Page Layouts `LayoutBoard`, but each field is a `CardFieldPlacement` (carrying per-field knobs).
 */
export function CardDisplaySectionBoard({
  value, onChange, properties, idPrefix,
}: CardDisplaySectionBoardProps) {
  const {
    t,
  } = useTranslation();
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 4,
    },
  }));

  const fieldLabels = new Map(
    [...STANDARD_CARD_FIELDS, ...eligibleCustomCardFields(properties)].map(f => [f.key, f.label]),
  );
  const labelFor = (key: string) => fieldLabels.get(key) ?? key;
  // The progress (itemInItems) property ids — these fields get the "Show numbers"/"Show unit text" toggles.
  const progressKeys = new Set(properties.filter(p => p.type === "itemInItems").map(p => p.id));

  const placed = placedFieldKeys(value);
  const trayKeys = [...fieldLabels.keys()].filter(key => !placed.has(key));

  function handleDragEnd(activeId: string, overId: string | null): void {
    if (!overId) return;
    if (overId === TRAY_ID) {
      onChange(moveCardField(value, activeId, {
        type: "tray",
      }));
      return;
    }
    if (overId.startsWith("sec:")) {
      onChange(moveCardField(value, activeId, {
        type: "section",
        key: overId.slice(4),
      }));
      return;
    }
    if (overId.startsWith("corner:")) {
      onChange(moveCardField(value, activeId, {
        type: "corner",
        corner: overId.slice(7) as CardImageCorner,
      }));
      return;
    }
    if (overId.startsWith("field:")) {
      // Dropped onto another chip — insert into that chip's container at its index.
      const targetKey = overId.slice(6);
      const target = locateField(value, targetKey);
      if (target) onChange(moveCardField(value, activeId, target.target, target.index));
    }
  }

  // "Move to…" destinations shared by every field chip.
  const moveTargets: { label: string;
    target: CardFieldTarget; }[] = [
    ...value.sections.map(section => ({
      label: t("Section: {{name}}", {
        name: section.title || section.key,
      }),
      target: {
        type: "section" as const,
        key: section.key,
      },
    })),
    ...CARD_IMAGE_CORNER_KEYS.map(corner => ({
      label: t("Image {{corner}}", {
        corner: t(CORNER_LABELS[corner]).toLowerCase(),
      }),
      target: {
        type: "corner" as const,
        corner,
      },
    })),
    {
      label: t("Hidden (available)"),
      target: {
        type: "tray" as const,
      },
    },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={boardCollision}
      onDragEnd={event => handleDragEnd(String(event.active.id), event.over ? String(event.over.id) : null)}
    >
      <div className="space-y-4">
        {value.sections.map((section, index) => (
          <SectionCard
            key={section.key}
            section={section}
            index={index}
            total={value.sections.length}
            labelFor={labelFor}
            progressKeys={progressKeys}
            moveTargets={moveTargets.filter(mt => !(mt.target.type === "section" && mt.target.key === section.key))}
            idPrefix={idPrefix}
            value={value}
            onChange={onChange}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => onChange({
            ...value,
            sections: addCardSection(value.sections),
          })}
        >
          <Plus className="mr-1 size-4" />
          {t("Add section")}
        </Button>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("Image corners")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("Fields dropped here overlay the card image (shown only when the card has an image).")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CARD_IMAGE_CORNER_KEYS.map(corner => (
              <CornerDropArea
                key={corner}
                corner={corner}
                fields={value.imageCorners[corner]}
                labelFor={labelFor}
                progressKeys={progressKeys}
                moveTargets={moveTargets.filter(mt => !(mt.target.type === "corner" && mt.target.corner === corner))}
                onMoveField={(fieldKey, target) => onChange(moveCardField(value, fieldKey, target))}
                onToggleHideLabel={(fieldKey, on) => onChange(patchFieldPlacement(value, fieldKey, {
                  hideLabel: on,
                }))}
                onPatchField={(fieldKey, patch) => onChange(patchFieldPlacement(value, fieldKey, patch))}
              />
            ))}
          </div>
        </div>

        <TrayDropArea
          trayKeys={trayKeys}
          labelFor={labelFor}
          moveTargets={moveTargets.filter(mt => mt.target.type !== "tray")}
          onMoveField={(fieldKey, target) => onChange(moveCardField(value, fieldKey, target))}
        />
      </div>
    </DndContext>
  );
}
