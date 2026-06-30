import type { PlaceType } from "@eesimple/types";

import { useState } from "react";

import { Pencil, Trash2 } from "lucide-react";

import { DeletePlaceTypeDialog } from "./DeletePlaceTypeDialog";
import { useCreatePlaceType, usePlaceTypes, useUpdatePlaceType } from "../hooks/usePlaceTypes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PlaceTypesCard() {
  const {
    data: placeTypesData, isLoading,
  } = usePlaceTypes();
  const createPlaceType = useCreatePlaceType();
  const updatePlaceType = useUpdatePlaceType();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<PlaceType | null>(null);

  const sorted = [...(placeTypesData ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    createPlaceType.mutate({
      name,
    }, {
      onSuccess: () => setNewName(""),
    });
  }

  function startEdit(pt: PlaceType) {
    setEditingId(pt.id);
    setEditName(pt.name);
  }

  function commitEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (name) {
      updatePlaceType.mutate(
        {
          id: editingId,
          input: {
            name,
          },
        },
        {
          onSuccess: () => setEditingId(null),
        },
      );
    }
    else {
      setEditingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Place Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="New place type…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!newName.trim() || createPlaceType.isPending}
          >
            Add
          </Button>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

        {!isLoading && sorted.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No place types yet. Add one to start classifying your locations.
            </p>
          )
          : null}

        {sorted.length > 0
          ? (
            <div className="space-y-1">
              {sorted.map(pt =>
                editingId === pt.id
                  ? (
                    <div
                      key={pt.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1"
                    >
                      <Input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-7 text-sm"
                      />
                    </div>
                  )
                  : (
                    <div
                      key={pt.id}
                      className="
                        flex items-center gap-2 rounded-md px-2 py-1
                        hover:bg-accent/50
                      "
                    >
                      <span className="flex-1 text-sm">{pt.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{pt.slug}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => startEdit(pt)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="
                          size-7 shrink-0 text-destructive
                          hover:text-destructive
                        "
                        onClick={() => setDeleting(pt)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
            </div>
          )
          : null}
      </CardContent>

      <DeletePlaceTypeDialog
        placeType={deleting}
        placeTypes={sorted}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
