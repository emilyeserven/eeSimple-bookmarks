import type { Movie } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { PlexTitleForm } from "./PlexTitleForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddMovieModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created movie so the opener can select it. */
  onCreated?: (movie: Movie) => void;
}

/** Full create-movie form (name, Plex lookup, media property) inside a dialog. */
export function AddMovieModal({
  open, onOpenChange, onCreated,
}: AddMovieModalProps) {
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
          <DialogTitle>{t("New movie")}</DialogTitle>
          <DialogDescription>
            {t("Give the movie a name, or look it up on Plex to fill in its details automatically.")}
          </DialogDescription>
        </DialogHeader>

        <PlexTitleForm
          kind="movie"
          onCreated={(item) => {
            onCreated?.(item as Movie);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
