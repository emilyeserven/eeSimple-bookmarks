import type { ChoicesItem } from "@eesimple/types";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SortableChoiceItemProps {
  item: ChoicesItem;
  index: number;
  idPrefix: string;
  onLabelChange: (index: number, label: string) => void;
  onLabelBlur: (index: number, label: string) => void;
  onDefaultChange: (index: number) => void;
  onRemove: (index: number) => void;
}

export function SortableChoiceItem({
  item, index, idPrefix, onLabelChange, onLabelBlur, onDefaultChange, onRemove,
}: SortableChoiceItemProps) {
  const {
    t,
  } = useTranslation();
  const {
    attributes, listeners, setNodeRef, transform, transition,
  } = useSortable({
    id: item.value,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground"
        aria-label={t("Drag to reorder")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <Input
        value={item.label}
        placeholder={t("Label")}
        className="flex-1"
        onChange={e => onLabelChange(index, e.target.value)}
        onBlur={e => onLabelBlur(index, e.target.value)}
      />
      <div className="flex shrink-0 items-center gap-1.5">
        <input
          type="radio"
          name={`${idPrefix}-choices-default`}
          id={`${idPrefix}-choices-default-${index}`}
          checked={item.isDefault ?? false}
          onChange={() => onDefaultChange(index)}
        />
        <Label
          htmlFor={`${idPrefix}-choices-default-${index}`}
          className="text-xs text-muted-foreground"
        >
          {t("Default")}
        </Label>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
      >
        {t("Remove")}
      </Button>
    </li>
  );
}
