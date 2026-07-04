import { useTranslation } from "react-i18next";

import { ImportForm } from "./ImportForm";
import { useUiStore } from "../stores/uiStore";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Global modal for adding an import. Controlled via uiStore — mount once in the root layout. */
export function AddImportModal() {
  const {
    t,
  } = useTranslation();
  const open = useUiStore(s => s.addImportModalOpen);
  const setOpen = useUiStore(s => s.setAddImportModalOpen);
  const initialNewsletterId = useUiStore(s => s.importModalInitialNewsletterId);
  const setInitialNewsletterId = useUiStore(s => s.setImportModalInitialNewsletterId);

  function handleComplete() {
    setOpen(false);
    setInitialNewsletterId(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setInitialNewsletterId(null);
        setOpen(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Add import")}</DialogTitle>
          <DialogDescription>
            {t("Paste content, fetch a URL, or upload a file. Links are extracted and queued for review in your inbox.")}
          </DialogDescription>
        </DialogHeader>
        <ImportForm
          initialNewsletterId={initialNewsletterId}
          onComplete={handleComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
