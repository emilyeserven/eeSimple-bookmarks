import { Button } from "@/components/ui/button";

interface DetailHeaderActionsProps {
  /** When set, renders an outline "Edit" button. */
  onEdit?: () => void;
  /** When set, renders a destructive ghost "Delete" button. */
  onDelete?: () => void;
}

/**
 * The Edit / Delete action cluster that sits at the top-right of a detail page's title row.
 * Renders nothing when neither handler is provided. Shared by `BookmarkDetail` and `PropertyDetail`.
 */
export function DetailHeaderActions({
  onEdit, onDelete,
}: DetailHeaderActionsProps) {
  if (!onEdit && !onDelete) return null;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {onEdit
        ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            Edit
          </Button>
        )
        : null}
      {onDelete
        ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="
              text-destructive
              hover:text-destructive
            "
          >
            Delete
          </Button>
        )
        : null}
    </div>
  );
}
