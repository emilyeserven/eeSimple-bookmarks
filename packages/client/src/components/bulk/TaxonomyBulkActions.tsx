import type { BulkDeleteResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TaxonomyBulkActionsProps {
  ids: string[];
  /** The entity's bulk-delete mutation (from `useBulkDelete<Entity>`). */
  bulkDelete: UseMutationResult<BulkDeleteResult[], Error, string[]>;
  /** Singular/plural noun for the confirm copy, e.g. ["category", "categories"]. */
  noun: [string, string];
  /** Called after a successful delete so the caller can clear its selection. */
  onDone: () => void;
}

/** The bulk-delete control for a taxonomy listing, rendered inside the {@link BulkActionBar}. */
export function TaxonomyBulkActions({
  ids,
  bulkDelete,
  noun,
  onDone,
}: TaxonomyBulkActionsProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = ids.length === 1 ? noun[0] : noun[1];
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
        >
          {t("Delete")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("Delete {{count}} {{label}}?", {
              count: ids.length,
              label,
            })}
          </DialogTitle>
          <DialogDescription>
            {t("Built-in items are skipped. This cannot be undone.")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("Cancel")}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={bulkDelete.isPending}
            onClick={() => bulkDelete.mutate(ids, {
              onSuccess: () => {
                setOpen(false);
                onDone();
              },
            })}
          >
            {t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
