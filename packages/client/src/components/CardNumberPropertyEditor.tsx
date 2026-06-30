import type { CustomProperty } from "@eesimple/types";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CardNumberPropertyEditorProps {
  property: CustomProperty;
  inputId: string;
  /** The bookmark's current value for this property, or `undefined` when unset. */
  current: number | undefined;
  /** Commit a new numeric value (called on blur / Enter, only when it changed). */
  onCommit: (value: number) => void;
}

/** A labelled number input rendered inside the card's "More" menu (keystrokes stay out of the menu). */
export function CardNumberPropertyEditor({
  property, inputId, current, onCommit,
}: CardNumberPropertyEditorProps) {
  const [draft, setDraft] = useState(current === undefined ? "" : String(current));

  // Re-seed when the saved value changes (e.g. after a successful save or external update).
  useEffect(() => {
    setDraft(current === undefined ? "" : String(current));
  }, [current]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === "") return;
    const next = Number(trimmed);
    if (Number.isNaN(next) || next === current) return;
    onCommit(next);
  }

  return (
    <div className="px-2 py-1.5">
      <Label
        htmlFor={inputId}
        className="text-xs text-muted-foreground"
      >
        {property.name}
        {property.unitPlural ? ` (${property.unitPlural})` : ""}
      </Label>
      <Input
        id={inputId}
        type="number"
        className="mt-1 h-8"
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        // Keep typing (digits, space, arrows) from reaching the menu's typeahead/navigation.
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}
