import type { Location } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LocationForm } from "./LocationForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created location so the opener can navigate to it. */
  onCreated?: (location: Location) => void;
}

/** Full create-location form (name, coordinates, ancestor chain, …) inside a dialog. */
export function AddLocationModal({
  open, onOpenChange, onCreated,
}: AddLocationModalProps) {
  const {
    t,
  } = useTranslation();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("New location")}</DialogTitle>
          <DialogDescription>
            {t("Create a location, including its parent chain if needed.")}
          </DialogDescription>
        </DialogHeader>

        <LocationForm
          onCreated={(location) => {
            onCreated?.(location);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
