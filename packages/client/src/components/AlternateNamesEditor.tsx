import type { LocationAlternateName } from "@eesimple/types";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AlternateNamesEditorProps {
  /** The current alternate names. */
  value: LocationAlternateName[];
  /** Called with the next list whenever a row is added, edited, or removed. */
  onChange: (next: LocationAlternateName[]) => void;
  /** Optional commit handler with the settled list, e.g. to fire an auto-save on blur/remove. */
  onCommit?: (next: LocationAlternateName[]) => void;
}

/**
 * Add/remove rows of `{ value, style }` alternate names (e.g. different romanization styles for a
 * place). Shared by the location create form and the edit (auto-save) tab; the parent owns persistence.
 */
export function AlternateNamesEditor({
  value, onChange, onCommit,
}: AlternateNamesEditorProps) {
  function updateRow(index: number, patch: Partial<LocationAlternateName>) {
    onChange(value.map((row, i) => (i === index
      ? {
        ...row,
        ...patch,
      }
      : row)));
  }

  function removeRow(index: number) {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
    onCommit?.(next);
  }

  function addRow() {
    onChange([...value, {
      value: "",
      style: null,
    }]);
  }

  return (
    <div className="space-y-2">
      <Label>Alternate names</Label>
      {value.length === 0
        ? <p className="text-xs text-muted-foreground">No alternate names yet.</p>
        : null}
      <div className="space-y-2">
        {value.map((row, index) => (
          <div
            key={index}
            className="flex items-center gap-2"
          >
            <Input
              aria-label={`Alternate name ${index + 1}`}
              placeholder="Alternate name"
              value={row.value}
              onChange={event => updateRow(index, {
                value: event.target.value,
              })}
              onBlur={() => onCommit?.(value)}
              className="flex-1"
            />
            <Input
              aria-label={`Style for alternate name ${index + 1}`}
              placeholder="Style (e.g. Hepburn)"
              value={row.style ?? ""}
              onChange={event => updateRow(index, {
                style: event.target.value || null,
              })}
              onBlur={() => onCommit?.(value)}
              className="w-40"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove alternate name ${index + 1}`}
              onClick={() => removeRow(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
      >
        <Plus className="mr-2 size-4" />
        Add alternate name
      </Button>
    </div>
  );
}
