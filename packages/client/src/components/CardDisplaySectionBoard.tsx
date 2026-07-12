import type { CardDisplayFields, CardFieldTarget } from "../lib/cardDisplaySectionMutations";
import type { CollisionDetection } from "@dnd-kit/core";
import type { CardDisplaySection, CardImageCorner, CardSectionForm, CardZoneLayout, CustomProperty } from "@eesimple/types";

import { useState } from "react";

import {
  DndContext,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Move, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SectionVisibilityEditor } from "./SectionVisibilityEditor";
import { eligibleCustomCardFields, isMultiValueTaxonomyField, STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFieldDefs";
import {
  addCardSection,
  CARD_IMAGE_CORNER_KEYS,
  moveCardField,
  moveCardSection,
  patchFieldPlacement,
  placedFieldKeys,
  removeSection,
  renameCardSection,
  setSectionForm,
  setSectionLayout,
  setCardSectionVisibility,
} from "../lib/cardDisplaySectionMutations";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const TRAY_ID = "card-tray";

/** Prefer the container the pointer is inside, falling back to rect intersection (see `LayoutBoard`). */
const boardCollision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};

/** Human labels for the four image corners. */
const CORNER_LABELS: Record<CardImageCorner, string> = {
  "top-left": "Top left",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

/** The per-section "layout" dropdown value = a (form, grid?) pair encoded as one option. */
const FORM_OPTIONS: { value: string;
  label: string;
  form: CardSectionForm;
  mode: "flex" | "grid"; }[] = [
  {
    value: "stacked-flex",
    label: "Stacked rows",
    form: "stacked",
    mode: "flex",
  },
  {
    value: "stacked-grid",
    label: "Stacked grid",
    form: "stacked",
    mode: "grid",
  },
  {
    value: "inline-flex",
    label: "Inline pills",
    form: "inline",
    mode: "flex",
  },
  {
    value: "inline-grid",
    label: "Two-column pills",
    form: "inline",
    mode: "grid",
  },
  {
    value: "table",
    label: "Details table",
    form: "table",
    mode: "grid",
  },
];

function formOptionValue(section: CardDisplaySection): string {
  if (section.form === "table") return "table";
  return `${section.form}-${section.layout.mode}`;
}

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
                moveTargets={moveTargets.filter(mt => !(mt.target.type === "corner" && mt.target.corner === corner))}
                onMoveField={(fieldKey, target) => onChange(moveCardField(value, fieldKey, target))}
                onToggleHideLabel={(fieldKey, on) => onChange(patchFieldPlacement(value, fieldKey, {
                  hideLabel: on,
                }))}
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

/** Locate a field's container + index (for drop-onto-chip insertion). */
function locateField(value: CardDisplayFields, fieldKey: string): { target: CardFieldTarget;
  index: number; } | null {
  for (const section of value.sections) {
    const idx = section.fields.findIndex(f => f.key === fieldKey);
    if (idx >= 0) return {
      target: {
        type: "section",
        key: section.key,
      },
      index: idx,
    };
  }
  for (const corner of CARD_IMAGE_CORNER_KEYS) {
    const idx = value.imageCorners[corner].findIndex(f => f.key === fieldKey);
    if (idx >= 0) return {
      target: {
        type: "corner",
        corner,
      },
      index: idx,
    };
  }
  return null;
}

interface MoveTargetList {
  label: string;
  target: CardFieldTarget;
}

function SectionCard({
  section, index, total, labelFor, moveTargets, idPrefix, value, onChange,
}: {
  section: CardDisplaySection;
  index: number;
  total: number;
  labelFor: (key: string) => string;
  moveTargets: MoveTargetList[];
  idPrefix: string;
  value: CardDisplayFields;
  onChange: (next: CardDisplayFields) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    setNodeRef, isOver,
  } = useDroppable({
    id: `sec:${section.key}`,
  });
  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <InlineEditableLabel
          value={section.title ?? ""}
          placeholder={t("Section name")}
          onCommit={title => onChange({
            ...value,
            sections: renameCardSection(value.sections, section.key, title),
          })}
        />
        <div className="ml-auto flex items-center gap-1">
          <SectionVisibilityEditor
            tree={section.visibleIf}
            onChange={tree => onChange({
              ...value,
              sections: setCardSectionVisibility(value.sections, section.key, tree),
            })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={index === 0}
            aria-label={t("Move up")}
            onClick={() => onChange({
              ...value,
              sections: moveCardSection(value.sections, section.key, -1),
            })}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={index === total - 1}
            aria-label={t("Move down")}
            onClick={() => onChange({
              ...value,
              sections: moveCardSection(value.sections, section.key, 1),
            })}
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="
              size-7 text-muted-foreground
              hover:text-destructive
            "
            aria-label={t("Delete section")}
            onClick={() => onChange({
              ...value,
              sections: removeSection(value.sections, section.key),
            })}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <SectionLayoutControls
        section={section}
        onFormChange={(form, mode) => {
          const next = setSectionForm(value.sections, section.key, form);
          onChange({
            ...value,
            sections: setSectionLayout(next, section.key, {
              ...section.layout,
              mode,
            }),
          });
        }}
        onLayoutChange={layout => onChange({
          ...value,
          sections: setSectionLayout(value.sections, section.key, layout),
        })}
      />

      <div
        ref={setNodeRef}
        className={`
          min-h-10 rounded-md border border-dashed p-2
          ${isOver
      ? "border-primary bg-primary/5"
      : "border-input"}
        `}
      >
        <SortableContext
          items={section.fields.map(f => `field:${f.key}`)}
          strategy={rectSortingStrategy}
        >
          {section.fields.length === 0
            ? <p className="text-xs text-muted-foreground">{t("Drop fields here")}</p>
            : (
              <div className="flex flex-wrap gap-1.5">
                {section.fields.map(field => (
                  <FieldChip
                    key={field.key}
                    fieldKey={field.key}
                    label={labelFor(field.key)}
                    hideLabel={field.hideLabel ?? false}
                    maxTerms={field.maxTerms ?? null}
                    collapseToCount={field.collapseToCount ?? false}
                    idPrefix={idPrefix}
                    moveTargets={moveTargets}
                    onMove={target => onChange(moveCardField(value, field.key, target))}
                    onToggleHideLabel={on => onChange(patchFieldPlacement(value, field.key, {
                      hideLabel: on,
                    }))}
                    onSetMaxTerms={max => onChange(patchFieldPlacement(value, field.key, {
                      maxTerms: max,
                    }))}
                    onToggleCollapseToCount={on => onChange(patchFieldPlacement(value, field.key, {
                      collapseToCount: on,
                    }))}
                  />
                ))}
              </div>
            )}
        </SortableContext>
      </div>
    </div>
  );
}

function SectionLayoutControls({
  section, onFormChange, onLayoutChange,
}: {
  section: CardDisplaySection;
  onFormChange: (form: CardSectionForm, mode: "flex" | "grid") => void;
  onLayoutChange: (layout: CardZoneLayout) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{t("Layout")}</span>
        <Select
          value={formOptionValue(section)}
          onValueChange={(next) => {
            const opt = FORM_OPTIONS.find(o => o.value === next);
            if (opt) onFormChange(opt.form, opt.mode);
          }}
        >
          <SelectTrigger className="h-7 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_OPTIONS.map(opt => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >{t(opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {section.form !== "table" && (
        <label className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{t("Gap")}</span>
          <Select
            value={section.layout.gap ?? "md"}
            onValueChange={gap => onLayoutChange({
              ...section.layout,
              gap: gap as CardZoneLayout["gap"],
            })}
          >
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">{t("Small")}</SelectItem>
              <SelectItem value="md">{t("Medium")}</SelectItem>
              <SelectItem value="lg">{t("Large")}</SelectItem>
            </SelectContent>
          </Select>
        </label>
      )}
    </div>
  );
}

function FieldChip({
  fieldKey, label, hideLabel, maxTerms = null, collapseToCount = false, idPrefix, moveTargets, onMove,
  onToggleHideLabel, onSetMaxTerms, onToggleCollapseToCount,
}: {
  fieldKey: string;
  label: string;
  hideLabel: boolean;
  maxTerms?: number | null;
  collapseToCount?: boolean;
  idPrefix: string;
  moveTargets: MoveTargetList[];
  onMove: (target: CardFieldTarget) => void;
  onToggleHideLabel: (on: boolean) => void;
  /** Present only for body-zone fields; when omitted the term-display controls are hidden (corners/tray). */
  onSetMaxTerms?: (max: number | null) => void;
  onToggleCollapseToCount?: (on: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  // Term-display controls only apply to multi-value taxonomy fields in a body zone (where the
  // handlers are wired) — not to image-corner overlays or the hidden tray.
  const showTermControls = isMultiValueTaxonomyField(fieldKey) && !!onSetMaxTerms && !!onToggleCollapseToCount;
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: `field:${fieldKey}`,
  });
  return (
    <span
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="
        inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1
        text-xs
      "
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground"
        aria-label={t("Drag {{label}}", {
          label,
        })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <span>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("Field options")}
          className="
            text-muted-foreground
            hover:text-foreground
          "
          onPointerDown={e => e.stopPropagation()}
        >
          <Move className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("Move to")}</DropdownMenuLabel>
          {moveTargets.map((mt, i) => (
            <DropdownMenuItem
              key={`${idPrefix}-${fieldKey}-${i}`}
              onSelect={() => onMove(mt.target)}
            >
              {mt.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={e => e.preventDefault()}>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={hideLabel}
                onCheckedChange={checked => onToggleHideLabel(checked === true)}
              />
              {t("Hide label")}
            </label>
          </DropdownMenuItem>
          {showTermControls
            ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  <label className="flex items-center gap-2">
                    <span>{t("Max terms")}</span>
                    <Input
                      type="number"
                      min={0}
                      value={maxTerms ?? ""}
                      placeholder={t("All")}
                      className="h-7 w-16 text-xs"
                      onPointerDown={e => e.stopPropagation()}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          onSetMaxTerms?.(null);
                          return;
                        }
                        const parsed = Number.parseInt(raw, 10);
                        onSetMaxTerms?.(Number.isNaN(parsed) ? null : Math.max(0, parsed));
                      }}
                    />
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={collapseToCount}
                      onCheckedChange={checked => onToggleCollapseToCount?.(checked === true)}
                    />
                    {t("Count only")}
                  </label>
                </DropdownMenuItem>
              </>
            )
            : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

function CornerDropArea({
  corner, fields, labelFor, moveTargets, onMoveField, onToggleHideLabel,
}: {
  corner: CardImageCorner;
  fields: { key: string;
    hideLabel?: boolean; }[];
  labelFor: (key: string) => string;
  moveTargets: MoveTargetList[];
  onMoveField: (fieldKey: string, target: CardFieldTarget) => void;
  onToggleHideLabel: (fieldKey: string, on: boolean) => void;
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
              idPrefix={`corner-${corner}`}
              moveTargets={moveTargets}
              onMove={target => onMoveField(field.key, target)}
              onToggleHideLabel={on => onToggleHideLabel(field.key, on)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function TrayDropArea({
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

/** A label that turns into a text input on click, committing on blur / Enter (Escape cancels). */
function InlineEditableLabel({
  value, placeholder, onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        placeholder={placeholder}
        className="h-7 w-48 text-sm"
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft !== value) onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <button
      type="button"
      className="
        text-sm font-medium
        hover:underline
      "
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value || placeholder}
    </button>
  );
}
