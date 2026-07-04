import type { PlaceType } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { useDeletePlaceType } from "../hooks/usePlaceTypes";

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

interface DeletePlaceTypeDialogProps {
  /** The place type pending deletion; `null` keeps the dialog closed. */
  placeType: PlaceType | null;
  /** All place types — used to build the reassignment picker (the deleted one is excluded). */
  placeTypes: PlaceType[];
  onClose: () => void;
}

/**
 * Confirm deleting a place type, optionally reassigning the locations that use it to a different place
 * type. When the place type has no locations it's a plain confirm; otherwise a "Reassign locations to…"
 * picker is offered (leaving it blank deletes and leaves those locations without a place type).
 */
export function DeletePlaceTypeDialog({
  placeType,
  placeTypes,
  onClose,
}: DeletePlaceTypeDialogProps) {
  const {
    t,
  } = useTranslation();
  const deletePlaceType = useDeletePlaceType();
  const [reassignTo, setReassignTo] = useState<string | undefined>(undefined);

  const open = placeType !== null;
  const count = placeType?.locationCount ?? 0;
  const options = placeTypes
    .filter(pt => pt.id !== placeType?.id)
    .map(pt => ({
      value: pt.id,
      label: pt.name,
    }));

  function handleClose() {
    setReassignTo(undefined);
    onClose();
  }

  function handleDelete() {
    if (!placeType) return;
    deletePlaceType.mutate(
      {
        id: placeType.id,
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
              name: placeType?.name,
            })}
          </DialogTitle>
          <DialogDescription>
            {count > 0
              ? (count === 1
                ? t("{{count}} location uses this place type.", {
                  count,
                })
                : t("{{count}} locations use this place type.", {
                  count,
                }))
              : t("No locations use this place type.")}
          </DialogDescription>
        </DialogHeader>

        {count > 0 && options.length > 0
          ? (
            <div className="space-y-2">
              <Label htmlFor="reassign-place-type">{t("Reassign locations to… (optional)")}</Label>
              <Combobox
                id="reassign-place-type"
                options={options}
                value={reassignTo}
                onValueChange={setReassignTo}
                placeholder={t("Leave blank to remove the place type")}
                searchPlaceholder={t("Search place types…")}
                emptyText={t("No other place types.")}
              />
              <p className="text-xs text-muted-foreground">
                {t("Leaving this blank deletes the place type and leaves those locations without one.")}
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
            disabled={deletePlaceType.isPending}
            onClick={handleDelete}
          >
            {deletePlaceType.isPending ? t("Deleting…") : t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
