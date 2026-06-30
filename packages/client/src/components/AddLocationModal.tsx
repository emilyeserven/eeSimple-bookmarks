import type { Location } from "@eesimple/types";

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
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New location</DialogTitle>
          <DialogDescription>
            Create a location, including its parent chain if needed.
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
