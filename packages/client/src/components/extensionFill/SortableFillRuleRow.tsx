import type { ComboboxOption } from "../Combobox";
import type { WebsiteExtensionFillRule } from "@eesimple/types";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledInput } from "./controls";
import { FillRuleFields } from "./FillRuleFields";

import { Button } from "@/components/ui/button";

/** One draggable rule card: a drag handle + label + remove button over the rule's field body. */
export function SortableFillRuleRow({
  rule, propertyOptions, onChange, onRemove,
}: {
  rule: WebsiteExtensionFillRule;
  propertyOptions: ComboboxOption[];
  onChange: (rule: WebsiteExtensionFillRule) => void;
  onRemove: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    attributes, listeners, setNodeRef, transform, transition,
  } = useSortable({
    id: rule.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
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
          aria-label={t("Remove rule")}
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>
      <FillRuleFields
        rule={rule}
        propertyOptions={propertyOptions}
        onChange={onChange}
      />
    </div>
  );
}
