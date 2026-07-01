import { BookmarkForm } from "./BookmarkForm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddBookmarkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  autoScan?: boolean;
  /** When set, locks the new bookmark to this category and hides its Category picker. */
  lockedCategoryId?: string;
}

export function AddBookmarkModal({
  open,
  onOpenChange,
  initialUrl,
  autoScan,
  lockedCategoryId,
}: AddBookmarkModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Bookmark</DialogTitle>
        </DialogHeader>
        <BookmarkForm
          key={`${initialUrl ?? "empty"}|${lockedCategoryId ?? ""}`}
          initialUrl={initialUrl}
          autoScan={autoScan}
          lockedCategoryId={lockedCategoryId}
          onCreated={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
