import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface HomepageSectionFormActionsProps {
  isAutoSave: boolean;
  canSave: boolean;
  onCancel: () => void;
  isPending?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function HomepageSectionFormActions({
  isAutoSave, canSave, onCancel, isPending, onDelete, isDeleting,
}: HomepageSectionFormActionsProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2">
      {isAutoSave
        ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {t("Done")}
          </Button>
        )
        : (
          <>
            <Button
              type="submit"
              disabled={isPending || !canSave}
            >
              {isPending ? t("Saving…") : t("Save section")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              {t("Cancel")}
            </Button>
          </>
        )}
      {onDelete
        ? (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? t("Deleting…") : t("Delete section")}
          </Button>
        )
        : null}
    </div>
  );
}
