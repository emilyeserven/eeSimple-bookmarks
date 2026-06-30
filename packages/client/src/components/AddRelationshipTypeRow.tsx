import { useState } from "react";

import { useCreateRelationshipType } from "../hooks/useRelationshipTypes";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Inline "add a relationship type" form. */
export function AddRelationshipTypeRow() {
  const create = useCreateRelationshipType();
  const [name, setName] = useState("");
  const [directional, setDirectional] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    create.mutate(
      {
        name: trimmed,
        directional,
      },
      {
        onError: err => setError(err.message),
        onSuccess: () => {
          setName("");
          setDirectional(false);
          setError(null);
        },
      },
    );
  }

  return (
    <RowCard className="flex flex-wrap items-end gap-3 p-4">
      <div className="space-y-1">
        <Label
          htmlFor="new-relationship-type"
          className="text-xs text-muted-foreground"
        >
          New relationship type
        </Label>
        <Input
          id="new-relationship-type"
          value={name}
          placeholder="e.g. Inspiration"
          onChange={e => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="h-9 w-56"
        />
      </div>
      <label
        className="flex h-9 items-center gap-2 text-sm text-muted-foreground"
      >
        <Checkbox
          checked={directional}
          onCheckedChange={checked => setDirectional(checked === true)}
          aria-label="Directional"
        />
        Directional
      </label>
      <Button
        type="button"
        onClick={handleAdd}
        disabled={create.isPending || name.trim().length === 0}
      >
        Add
      </Button>
      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </RowCard>
  );
}
