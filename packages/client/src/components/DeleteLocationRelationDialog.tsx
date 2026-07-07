import type { LocationRelation } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { useDeleteLocationRelation } from "../hooks/useLocationRelations";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DeleteLocationRelationDialogProps {
  /** The relation pending deletion; `null` keeps the dialog closed. */
  locationRelation: LocationRelation | null;
  /** All relations — used to build the reassignment picker (the deleted one is excluded). */
  locationRelations: LocationRelation[];
  onClose: () => void;
}

/**
 * Confirm deleting a location relation, optionally reassigning the bookmark-location edges that use it
 * to a different relation. When the relation is used by no edges it's a plain confirm; otherwise a
 * "Reassign to…" picker is offered (leaving it blank deletes and clears the relation on those edges).
 */
export function DeleteLocationRelationDialog({
  locationRelation,
  locationRelations,
  onClose,
}: DeleteLocationRelationDialogProps) {
  const {
    t,
  } = useTranslation();
  const deleteLocationRelation = useDeleteLocationRelation();
  const [reassignTo, setReassignTo] = useState<string | undefined>(undefined);

  const open = locationRelation !== null;
  const count = locationRelation?.bookmarkCount ?? 0;
  const options = locationRelations
    .filter(relation => relation.id !== locationRelation?.id)
    .map(relation => ({
      value: relation.id,
      label: relation.name,
    }));

  function handleClose() {
    setReassignTo(undefined);
    onClose();
  }

  function handleDelete() {
    if (!locationRelation) return;
    deleteLocationRelation.mutate(
      {
        id: locationRelation.id,
        reassignTo: count > 0 ? reassignTo : undefined,
      },
      {
        onSuccess: handleClose,
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("Delete “{{name}}”?", {
              name: locationRelation?.name,
            })}
          </DialogTitle>
          <DialogDescription>
            {count > 0
              ? (count === 1
                ? t("{{count}} bookmark uses this relation.", {
                  count,
                })
                : t("{{count}} bookmarks use this relation.", {
                  count,
                }))
              : t("No bookmarks use this relation.")}
          </DialogDescription>
        </DialogHeader>

        {count > 0 && options.length > 0
          ? (
            <div className="space-y-2">
              <Label htmlFor="reassign-location-relation">{t("Reassign to… (optional)")}</Label>
              <Combobox
                id="reassign-location-relation"
                options={options}
                value={reassignTo}
                onValueChange={setReassignTo}
                placeholder={t("Leave blank to clear the relation")}
                searchPlaceholder={t("Search relations…")}
                emptyText={t("No other relations.")}
              />
              <p className="text-xs text-muted-foreground">
                {t("Leaving this blank deletes the relation and clears it from those bookmarks’ locations.")}
              </p>
            </div>
          )
          : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("Cancel")}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={deleteLocationRelation.isPending}
            onClick={handleDelete}
          >
            {deleteLocationRelation.isPending ? t("Deleting…") : t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
