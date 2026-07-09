import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, WebsiteExtensionFillRule } from "@eesimple/types";

import { useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Copy, GripVertical, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledInput } from "./controls";
import { FillRuleFields } from "./FillRuleFields";

import { Button } from "@/components/ui/button";
import { describeFillTarget } from "@/lib/extensionFillForm";
import { cn } from "@/lib/utils";

/** One draggable rule card: a collapsible header (drag + label + duplicate/remove) over the field body. */
export function SortableFillRuleRow({
  rule, propertyOptions, propertiesById, onChange, onRemove, onDuplicate,
}: {
  rule: WebsiteExtensionFillRule;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (rule: WebsiteExtensionFillRule) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const {
    t,
  } = useTranslation();
  // A configured rule (has a selector) loads collapsed; a fresh/blank draft opens expanded.
  const [open, setOpen] = useState(() => rule.extract.selector.trim() === "");
  const {
    attributes, listeners, setNodeRef, transform, transition,
  } = useSortable({
    id: rule.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const property = rule.target.kind === "customProperty"
    ? propertiesById.get(rule.target.propertyId)
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-3 rounded-lg border bg-card p-3"
    >
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="mb-2 cursor-grab touch-none text-muted-foreground"
          aria-label={t("Drag to reorder")}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mb-1 shrink-0"
          aria-label={open ? t("Collapse rule") : t("Expand rule")}
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
        >
          <ChevronDown
            className={cn("size-4 transition-transform", open
              ? "rotate-180"
              : "")}
          />
        </Button>
        <LabeledInput
          className="flex-1"
          label={t("Label")}
          placeholder={t("e.g. Print length")}
          value={rule.label}
          onChange={label => onChange({
            ...rule,
            label,
          })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Duplicate rule")}
          onClick={onDuplicate}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Remove rule")}
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>
      {open
        ? (
          <FillRuleFields
            rule={rule}
            propertyOptions={propertyOptions}
            propertiesById={propertiesById}
            onChange={onChange}
          />
        )
        : (
          <p className="truncate pl-8 text-sm text-muted-foreground">
            {describeFillTarget(rule.target, property)}
          </p>
        )}
    </div>
  );
}
