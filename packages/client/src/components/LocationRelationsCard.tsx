import type { LocationRelation } from "@eesimple/types";

import { useState } from "react";

import { Lock, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DeleteLocationRelationDialog } from "./DeleteLocationRelationDialog";
import {
  useCreateLocationRelation,
  useLocationRelations,
  useUpdateLocationRelation,
} from "../hooks/useLocationRelations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/** Settings → Locations → Location Relations: inline add / rename / delete (with reassign). */
export function LocationRelationsCard() {
  const {
    t,
  } = useTranslation();
  const {
    data: relationsData, isLoading,
  } = useLocationRelations();
  const createRelation = useCreateLocationRelation();
  const updateRelation = useUpdateLocationRelation();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<LocationRelation | null>(null);

  const sorted = [...(relationsData ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    createRelation.mutate({
      name,
    }, {
      onSuccess: () => setNewName(""),
    });
  }

  function startEdit(relation: LocationRelation) {
    setEditingId(relation.id);
    setEditName(relation.name);
  }

  function commitEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (name) {
      updateRelation.mutate(
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
        <CardTitle className="text-base">{t("Location Relations")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={t("New location relation…")}
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
            disabled={!newName.trim() || createRelation.isPending}
          >
            {t("Add")}
          </Button>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">{t("Loading…")}</p> : null}

        {!isLoading && sorted.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              {t("No location relations yet. Add one to start classifying how bookmarks relate to their locations.")}
            </p>
          )
          : null}

        {sorted.length > 0
          ? (
            <div className="space-y-1">
              {sorted.map(relation =>
                editingId === relation.id
                  ? (
                    <div
                      key={relation.id}
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
                      key={relation.id}
                      className="
                        flex items-center gap-2 rounded-md px-2 py-1
                        hover:bg-accent/50
                      "
                    >
                      <span className="flex-1 text-sm">{relation.name}</span>
                      {relation.builtIn
                        ? (
                          <span
                            className="
                              flex items-center gap-1 text-xs
                              text-muted-foreground
                            "
                            title={t("Built-in relation (can’t be renamed or deleted)")}
                          >
                            <Lock className="size-3.5" />
                            {t("Built-in")}
                          </span>
                        )
                        : null}
                      <span className="font-mono text-xs text-muted-foreground">{relation.slug}</span>
                      {relation.builtIn
                        ? null
                        : (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 shrink-0"
                              onClick={() => startEdit(relation)}
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
                              onClick={() => setDeleting(relation)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}
                    </div>
                  ))}
            </div>
          )
          : null}
      </CardContent>

      <DeleteLocationRelationDialog
        locationRelation={deleting}
        locationRelations={sorted}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
