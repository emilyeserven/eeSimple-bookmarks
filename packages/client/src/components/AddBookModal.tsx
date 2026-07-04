import type { Book } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BookForm } from "./BookForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created book so the opener can select it. */
  onCreated?: (book: Book) => void;
}

/** Full create-book form (name, Kavita lookup, media property) inside a dialog. */
export function AddBookModal({
  open, onOpenChange, onCreated,
}: AddBookModalProps) {
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
          <DialogTitle>{t("New book")}</DialogTitle>
          <DialogDescription>
            {t("Give the book a name, or look it up on Kavita to fill in its details automatically.")}
          </DialogDescription>
        </DialogHeader>

        <BookForm
          onCreated={(book) => {
            onCreated?.(book);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
