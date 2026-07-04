import { useTranslation } from "react-i18next";

import { BookmarkForm } from "./BookmarkForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookmarkAddFormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Settings → Display → Bookmark Add Form: shows the real create form rendered with the currently
 * saved field-placement settings, so a change can be checked without leaving the settings page.
 * `previewMode` disables the form's submit path — nothing is ever created from here.
 */
export function BookmarkAddFormPreviewDialog({
  open,
  onOpenChange,
}: BookmarkAddFormPreviewDialogProps) {
  const {
    t,
  } = useTranslation();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Add Bookmark form preview")}</DialogTitle>
          <DialogDescription>
            {t("This shows the Add Bookmark form with your current field placement settings. It's a preview only — no bookmark will be created.")}
          </DialogDescription>
        </DialogHeader>
        <BookmarkForm previewMode />
      </DialogContent>
    </Dialog>
  );
}
