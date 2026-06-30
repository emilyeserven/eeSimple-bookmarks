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
  return (
    <div className="flex flex-wrap gap-2">
      {isAutoSave
        ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Done
          </Button>
        )
        : (
          <>
            <Button
              type="submit"
              disabled={isPending || !canSave}
            >
              {isPending ? "Saving…" : "Save section"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
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
            {isDeleting ? "Deleting…" : "Delete section"}
          </Button>
        )
        : null}
    </div>
  );
}
