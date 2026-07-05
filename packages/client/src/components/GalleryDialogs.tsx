import type { Bookmark } from "@eesimple/types";

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Combobox for picking a bookmark to attach an orphan to. */
function BookmarkPicker({
  bookmarks,
  selected,
  onSelect,
}: {
  bookmarks: Bookmark[];
  selected: Bookmark | null;
  onSelect: (bookmark: Bookmark) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <Command className="rounded-lg border shadow-sm">
      <CommandInput placeholder={t("Search bookmarks…")} />
      <CommandList className="max-h-60">
        <CommandEmpty>{t("No bookmarks found.")}</CommandEmpty>
        <CommandGroup>
          {bookmarks.map(bookmark => (
            <CommandItem
              key={bookmark.id}
              value={bookmark.title}
              onSelect={() => onSelect(bookmark)}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate">{bookmark.title}</span>
              {selected?.id === bookmark.id
                ? <Check className="size-4 shrink-0 text-primary" />
                : null}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

interface GalleryDialogsProps {
  pendingLabel: string | null;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  deletePending: boolean;
  attachOpen: boolean;
  onCancelAttach: () => void;
  bookmarks: Bookmark[];
  attachTarget: Bookmark | null;
  onSelectTarget: (bookmark: Bookmark) => void;
  attachTargetHasImage: boolean;
  onConfirmAttach: () => void;
  attachPending: boolean;
}

/** The delete-confirmation and attach dialogs rendered by the Gallery. */
export function GalleryDialogs({
  pendingLabel,
  onCancelDelete,
  onConfirmDelete,
  deletePending,
  attachOpen,
  onCancelAttach,
  bookmarks,
  attachTarget,
  onSelectTarget,
  attachTargetHasImage,
  onConfirmAttach,
  attachPending,
}: GalleryDialogsProps) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      {/* Delete confirmation dialog */}
      <Dialog
        open={pendingLabel !== null}
        onOpenChange={open => !open && onCancelDelete()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete orphaned objects?")}</DialogTitle>
            <DialogDescription>
              {t("This permanently deletes {{label}} from storage. This can't be undone.", {
                label: pendingLabel ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancelDelete}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending}
              onClick={onConfirmDelete}
            >
              {deletePending ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach dialog */}
      <Dialog
        open={attachOpen}
        onOpenChange={open => !open && onCancelAttach()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Attach to bookmark")}</DialogTitle>
            <DialogDescription>
              {t("Choose a bookmark to attach this orphaned image to. This will set (or replace) that bookmark's image.")}
            </DialogDescription>
          </DialogHeader>

          <BookmarkPicker
            bookmarks={bookmarks}
            selected={attachTarget}
            onSelect={onSelectTarget}
          />

          {attachTargetHasImage
            ? (
              <p
                className="
                  text-sm text-amber-600
                  dark:text-amber-400
                "
              >
                {t("This bookmark already has an image — it will be replaced.")}
              </p>
            )
            : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancelAttach}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              disabled={!attachTarget || attachPending}
              onClick={onConfirmAttach}
            >
              {attachPending ? t("Attaching…") : t("Attach")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
