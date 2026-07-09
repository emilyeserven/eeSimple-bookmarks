import type { KindOption } from "./controls";
import type { ReactNode } from "react";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { KindSelect } from "./controls";

import { Button } from "@/components/ui/button";

/**
 * Chrome for one filter / transform row: a leading `kind` {@link KindSelect}, move up/down buttons,
 * a remove button, and the variant-specific `children` below. Inner rows reorder with buttons rather
 * than a nested drag context (the rules list itself is the dnd-kit sortable one).
 */
export function RowShell<T extends string>({
  kindLabel, kind, kindOptions, onKindChange, index, count, onMove, onRemove, children,
}: {
  kindLabel: string;
  kind: T;
  kindOptions: KindOption<T>[];
  onKindChange: (kind: T) => void;
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  children?: ReactNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2 rounded-md border p-2">
      <div className="flex items-end gap-2">
        <KindSelect
          label={kindLabel}
          value={kind}
          options={kindOptions}
          onValueChange={onKindChange}
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Move up")}
          disabled={index === 0}
          onClick={() => onMove(-1)}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Move down")}
          disabled={index === count - 1}
          onClick={() => onMove(1)}
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Remove")}
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}
