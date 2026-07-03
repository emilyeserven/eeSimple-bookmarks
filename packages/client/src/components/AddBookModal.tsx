import type { Book } from "@eesimple/types";

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
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New book</DialogTitle>
          <DialogDescription>
            Give the book a name, or look it up on Kavita to fill in its details automatically.
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
