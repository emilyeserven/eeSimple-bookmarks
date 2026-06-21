import type { RelationshipType } from "@eesimple/types";

import { useState } from "react";

import { ArrowRight, Trash2 } from "lucide-react";

import {
  useCreateRelationshipType,
  useDeleteRelationshipType,
  useRelationshipTypes,
  useUpdateRelationshipType,
} from "../hooks/useRelationshipTypes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** A single editable relationship-type row. */
function RelationshipTypeRow({
  relationshipType,
}: { relationshipType: RelationshipType }) {
  const update = useUpdateRelationshipType();
  const remove = useDeleteRelationshipType();
  const [name, setName] = useState(relationshipType.name);
  const [error, setError] = useState<string | null>(null);

  function commitName() {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed === relationshipType.name) {
      setName(relationshipType.name);
      return;
    }
    update.mutate(
      {
        id: relationshipType.id,
        input: {
          name: trimmed,
        },
      },
      {
        onError: (err) => {
          setError(err.message);
          setName(relationshipType.name);
        },
        onSuccess: () => setError(null),
      },
    );
  }

  function toggleDirectional(directional: boolean) {
    update.mutate({
      id: relationshipType.id,
      input: {
        directional,
      },
    });
  }

  return (
    <RowCard className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        {relationshipType.builtIn
          ? (
            <span className="font-medium">{relationshipType.name}</span>
          )
          : (
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="h-8 max-w-xs"
              aria-label="Relationship type name"
            />
          )}
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={relationshipType.directional}
          onCheckedChange={checked => toggleDirectional(checked === true)}
          aria-label="Directional"
        />
        Directional
      </label>

      {relationshipType.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
      {relationshipType.relationshipCount !== undefined
        ? (
          <Badge variant="outline">
            {relationshipType.relationshipCount}
            {" used"}
          </Badge>
        )
        : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={relationshipType.builtIn || remove.isPending}
        onClick={() => remove.mutate(relationshipType.id)}
        aria-label={`Delete ${relationshipType.name}`}
        title={relationshipType.builtIn ? "Built-in types can't be deleted" : "Delete"}
      >
        <Trash2 className="size-4" />
      </Button>
    </RowCard>
  );
}

/** Inline "add a relationship type" form. */
function AddRelationshipTypeRow() {
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

/** Browsable, editable relationship-type listing. */
export function RelationshipTypesListing() {
  const {
    data: relationshipTypes, isLoading, error,
  } = useRelationshipTypes();

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        Directional types
        {" ("}
        <ArrowRight className="inline size-3" />
        ) read as parent → child and power the Hierarchy view; symmetric types read the same
        {" from either bookmark."}
      </p>

      {isLoading ? <p className="text-muted-foreground">Loading relationship types…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      <div className="space-y-2">
        {(relationshipTypes ?? []).map(rt => (
          <RelationshipTypeRow
            key={rt.id}
            relationshipType={rt}
          />
        ))}
      </div>

      <AddRelationshipTypeRow />
    </div>
  );
}
