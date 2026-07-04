import type { TvShow } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { PlexTitleForm } from "./PlexTitleForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddTvShowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created TV show so the opener can select it. */
  onCreated?: (tvShow: TvShow) => void;
}

/** Full create-TV-show form (name, Plex lookup, media property) inside a dialog. */
export function AddTvShowModal({
  open, onOpenChange, onCreated,
}: AddTvShowModalProps) {
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
          <DialogTitle>{t("New TV show")}</DialogTitle>
          <DialogDescription>
            {t("Give the show a name, or look it up on Plex to fill in its details automatically.")}
          </DialogDescription>
        </DialogHeader>

        <PlexTitleForm
          kind="show"
          onCreated={(item) => {
            onCreated?.(item as TvShow);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
