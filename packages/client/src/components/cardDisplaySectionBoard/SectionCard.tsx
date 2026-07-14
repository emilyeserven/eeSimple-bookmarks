import type { MoveTargetList } from "./boardParts";
import type { CardDisplayFields } from "../../lib/cardDisplaySectionMutations";
import type { CardDisplaySection, CardSectionForm, CardZoneLayout } from "@eesimple/types";

import { useState } from "react";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FORM_OPTIONS, formOptionValue } from "./boardParts";
import { FieldChip } from "./FieldChip";
import {
  moveCardField,
  moveCardSection,
  patchFieldPlacement,
  removeSection,
  renameCardSection,
  setSectionForm,
  setSectionLayout,
  setCardSectionVisibility,
} from "../../lib/cardDisplaySectionMutations";
import { SectionVisibilityEditor } from "../SectionVisibilityEditor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function SectionCard({
  section, index, total, labelFor, progressKeys, moveTargets, idPrefix, value, onChange,
}: {
  section: CardDisplaySection;
  index: number;
  total: number;
  labelFor: (key: string) => string;
  progressKeys: Set<string>;
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
                    progressCount={field.showProgressCount ?? true}
                    progressUnit={field.showProgressUnit ?? true}
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
                    onToggleProgressCount={progressKeys.has(field.key)
                      ? on => onChange(patchFieldPlacement(value, field.key, {
                        showProgressCount: on,
                      }))
                      : undefined}
                    onToggleProgressUnit={progressKeys.has(field.key)
                      ? on => onChange(patchFieldPlacement(value, field.key, {
                        showProgressUnit: on,
                      }))
                      : undefined}
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
