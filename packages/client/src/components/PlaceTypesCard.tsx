import type { PlaceType, PlaceTypeLevelGroup } from "@eesimple/types";

import { useMemo, useState } from "react";

import { NO_LEVEL_MAP_COLOR, placeTypeKey } from "@eesimple/types";
import { Pencil, Trash2 } from "lucide-react";

import { DeletePlaceTypeDialog } from "./DeletePlaceTypeDialog";
import { useCreatePlaceType, usePlaceTypes, useUpdatePlaceType } from "../hooks/usePlaceTypes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PlaceTypesCardProps {
  /** All configured level groups — used to flag a place type not assigned to any of them. */
  groups: PlaceTypeLevelGroup[];
}

export function PlaceTypesCard({
  groups,
}: PlaceTypesCardProps) {
  const {
    data: placeTypesData, isLoading,
  } = usePlaceTypes();
  const createPlaceType = useCreatePlaceType();
  const updatePlaceType = useUpdatePlaceType();
  const assignedKeys = useMemo(
    () => new Set(groups.flatMap(group => group.placeTypes)),
    [groups],
  );

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
                      {!assignedKeys.has(placeTypeKey(pt.slug))
                        ? (
                          <span
                            className="
                              shrink-0 rounded-full border px-1.5 py-0.5
                              text-[10px] font-medium
                            "
                            style={{
                              color: NO_LEVEL_MAP_COLOR,
                              borderColor: NO_LEVEL_MAP_COLOR,
                            }}
                            title={`${pt.name} isn’t assigned to any level`}
                          >
                            No level
                          </span>
                        )
                        : null}
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
