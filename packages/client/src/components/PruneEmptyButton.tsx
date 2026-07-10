import { useState } from "react";

import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface PruneEmptyButtonProps {
  /** Ids of the currently-loaded items with zero associated bookmarks, eligible for deletion. */
  ids: string[];
  isPending: boolean;
  onPrune: (ids: string[], cb: { onSuccess: () => void }) => void;
  /** Singular/plural noun for the confirm copy, e.g. `["website", "websites"]`. */
  noun: [string, string];
}

/**
 * Deletes every currently-loaded item with zero associated bookmarks, behind a confirm dialog.
 * Reuses the entity's existing bulk-delete mutation with a precomputed zero-count id list, so no
 * new backend route is needed — mirrors the "Empty" facet already offered by Website's Filter
 * popover (`WebsiteListingControls`), just as a one-click delete instead of a view filter.
 */
export function PruneEmptyButton({
  ids, isPending, onPrune, noun,
}: PruneEmptyButtonProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const [singular, plural] = noun;
  const count = ids.length;

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={count === 0}
        >
          <Trash2 className="size-4" />
          {t("Prune empty")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("Delete {{count}} {{noun}} with no bookmarks?", {
              count,
              noun: count === 1 ? singular : plural,
            })}
          </DialogTitle>
          <DialogDescription>{t("This cannot be undone.")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("Cancel")}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isPending || count === 0}
            onClick={() => onPrune(ids, {
              onSuccess: () => setOpen(false),
            })}
          >
            {t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
