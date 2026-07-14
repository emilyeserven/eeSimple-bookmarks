import type { MoveTargetList } from "./boardParts";
import type { CardFieldTarget } from "../../lib/cardDisplaySectionMutations";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Move, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isMultiValueTaxonomyField } from "../../lib/bookmarkCardFieldDefs";

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
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export function FieldChip({
  fieldKey, label, hideLabel, maxTerms = null, collapseToCount = false,
  progressCount = true, progressUnit = true, idPrefix, moveTargets, onMove,
  onToggleHideLabel, onSetMaxTerms, onToggleCollapseToCount, onToggleProgressCount, onToggleProgressUnit,
}: {
  fieldKey: string;
  label: string;
  hideLabel: boolean;
  maxTerms?: number | null;
  collapseToCount?: boolean;
  /** Progress (itemInItems) "Show numbers" knob; absent = true. */
  progressCount?: boolean;
  /** Progress (itemInItems) "Show unit text" knob; absent = true. */
  progressUnit?: boolean;
  idPrefix: string;
  moveTargets: MoveTargetList[];
  onMove: (target: CardFieldTarget) => void;
  onToggleHideLabel: (on: boolean) => void;
  /** Present only for body-zone fields; when omitted the term-display controls are hidden (corners/tray). */
  onSetMaxTerms?: (max: number | null) => void;
  onToggleCollapseToCount?: (on: boolean) => void;
  /** Present only for a progress (itemInItems) field; both wired together to show the text toggles. */
  onToggleProgressCount?: (on: boolean) => void;
  onToggleProgressUnit?: (on: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  // Term-display controls only apply to multi-value taxonomy fields in a body zone (where the
  // handlers are wired) — not to image-corner overlays or the hidden tray.
  const showTermControls = isMultiValueTaxonomyField(fieldKey) && !!onSetMaxTerms && !!onToggleCollapseToCount;
  // Progress text toggles apply to a progress field in a section or image corner (not the tray).
  const showProgressControls = !!onToggleProgressCount && !!onToggleProgressUnit;
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
        </DropdownMenuContent>
      </DropdownMenu>
      {showTermControls
        ? (
          <TermDisplayControls
            label={label}
            maxTerms={maxTerms}
            collapseToCount={collapseToCount}
            onSetMaxTerms={max => onSetMaxTerms?.(max)}
            onToggleCollapseToCount={on => onToggleCollapseToCount?.(on)}
          />
        )
        : null}
      {showProgressControls
        ? (
          <ProgressDisplayControls
            label={label}
            progressCount={progressCount}
            progressUnit={progressUnit}
            onToggleProgressCount={on => onToggleProgressCount?.(on)}
            onToggleProgressUnit={on => onToggleProgressUnit?.(on)}
          />
        )
        : null}
    </span>
  );
}

/**
 * The multi-value taxonomy term-display controls (Max terms + Count only) for a field chip. Rendered
 * in a {@link Popover} — **not** a DropdownMenu — because a focusable number input inside a Radix
 * menu item fights the menu's roving-focus/typeahead (which blanked the page in the DropdownMenu
 * version). The trigger stops pointer propagation so opening the popover doesn't start a chip drag.
 */
function TermDisplayControls({
  label, maxTerms, collapseToCount, onSetMaxTerms, onToggleCollapseToCount,
}: {
  label: string;
  maxTerms: number | null;
  collapseToCount: boolean;
  onSetMaxTerms: (max: number | null) => void;
  onToggleCollapseToCount: (on: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("Term display options for {{label}}", {
          label,
        })}
        className="
          text-muted-foreground
          hover:text-foreground
        "
        onPointerDown={e => e.stopPropagation()}
      >
        <SlidersHorizontal className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 space-y-3 text-xs"
        onPointerDown={e => e.stopPropagation()}
      >
        <label className="flex items-center justify-between gap-2">
          <span>{t("Max terms")}</span>
          <Input
            type="number"
            min={0}
            value={maxTerms ?? ""}
            placeholder={t("All")}
            className="h-7 w-16 text-xs"
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onSetMaxTerms(null);
                return;
              }
              const parsed = Number.parseInt(raw, 10);
              onSetMaxTerms(Number.isNaN(parsed) ? null : Math.max(0, parsed));
            }}
          />
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={collapseToCount}
            onCheckedChange={checked => onToggleCollapseToCount(checked === true)}
          />
          {t("Count only")}
        </label>
        <p className="text-muted-foreground">
          {t("Cap how many terms show. \"Count only\" shows the icon + total instead of names once over the cap.")}
        </p>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Per-field text toggles for a progress (itemInItems) field: "Show numbers" (the "X of Y" count) and
 * "Show unit text" (the counter-word). Both default on, so a card can show either, both, or none. A ring
 * still renders in an image overlay regardless of these; they only control the accompanying text.
 */
function ProgressDisplayControls({
  label, progressCount, progressUnit, onToggleProgressCount, onToggleProgressUnit,
}: {
  label: string;
  progressCount: boolean;
  progressUnit: boolean;
  onToggleProgressCount: (on: boolean) => void;
  onToggleProgressUnit: (on: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("Progress display options for {{label}}", {
          label,
        })}
        className="
          text-muted-foreground
          hover:text-foreground
        "
        onPointerDown={e => e.stopPropagation()}
      >
        <SlidersHorizontal className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 space-y-3 text-xs"
        onPointerDown={e => e.stopPropagation()}
      >
        <label className="flex items-center gap-2">
          <Checkbox
            checked={progressCount}
            onCheckedChange={checked => onToggleProgressCount(checked === true)}
          />
          {t("Show numbers")}
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={progressUnit}
            onCheckedChange={checked => onToggleProgressUnit(checked === true)}
          />
          {t("Show unit text")}
        </label>
        <p className="text-muted-foreground">
          {t("Choose whether the \"X of Y\" numbers and/or the unit text show beside the progress ring.")}
        </p>
      </PopoverContent>
    </Popover>
  );
}
