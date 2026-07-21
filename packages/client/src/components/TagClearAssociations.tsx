import { useState } from "react";

import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledSection } from "./LabeledSection";
import { useClearTagAssociations } from "../hooks/useTags";
import { notifyError } from "../lib/notifications";

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

/**
 * Edit-only tag field (shown only for non-leaf tags via the field's `showIf`): remove all of this
 * tag's own bookmark associations — its `bookmark_tags` links and its id inside bookmarks' Sections
 * property — without deleting the tag. The child subtree and its associations are untouched. This is
 * the escape hatch for a non-leaf tag, which can't be delete-and-recreated to clear its links without
 * cascading away its children. Confirm-gated because there is no undo.
 */
export function TagClearAssociations({
  tagId,
}: { tagId: string }) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const clear = useClearTagAssociations();

  return (
    <LabeledSection
      title={t("Remove all bookmark associations")}
      description={t("Unlink every bookmark from this tag — including any references inside bookmarks' sections — without deleting the tag. Its child tags and their bookmarks are left untouched. This can't be undone.")}
    >
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="
              text-destructive
              hover:text-destructive
            "
            disabled={clear.isPending}
          >
            <Trash2 className="size-4" />
            {t("Remove all bookmark associations")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Remove all bookmark associations?")}</DialogTitle>
            <DialogDescription>{t("Every bookmark tagged with this tag (and any references to it inside bookmarks' sections) will be unlinked. The tag and its child tags stay. This can't be undone.")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("Cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={clear.isPending}
              onClick={() => clear.mutate(tagId, {
                onSuccess: () => setOpen(false),
                onError: (err: Error) => notifyError(err.message),
              })}
            >
              {t("Remove all")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LabeledSection>
  );
}
