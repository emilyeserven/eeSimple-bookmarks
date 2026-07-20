import type { TagNode } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { TreeCombobox } from "./TreeCombobox";
import { useDeleteTag, useTagTree } from "../hooks/useTags";
import { subtreeIds, tagNodesToOptions } from "../lib/tagTree";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DeleteTagDialogProps {
  /** The tag pending deletion (a tree node, so its subtree/counts are available); `null` keeps closed. */
  tag: TagNode | null;
  /** The full tag tree — builds the reassignment picker (the deleted tag and its subtree are excluded). */
  treeNodes: TagNode[];
  onClose: () => void;
  /** Called after a successful delete (e.g. to navigate away from the deleted tag's page). */
  onDeleted?: () => void;
}

/**
 * Confirm deleting a tag, optionally reassigning the bookmarks and section entries that reference it
 * (or any of its sub-tags) to a different tag. Deleting a tag cascades away its sub-tags, so the
 * reassignment covers the whole subtree; leaving the picker blank deletes and drops those bookmark
 * memberships / leaves the section references dangling (today's behavior).
 */
export function DeleteTagDialog({
  tag,
  treeNodes,
  onClose,
  onDeleted,
}: DeleteTagDialogProps) {
  const {
    t,
  } = useTranslation();
  const deleteTag = useDeleteTag();
  const [reassignTo, setReassignTo] = useState<string | undefined>(undefined);

  const open = tag !== null;
  const bookmarkCount = tag?.bookmarkCount ?? 0;
  const sectionCount = tag?.sectionBookmarkCount ?? 0;
  const affectedCount = bookmarkCount + sectionCount;
  const hasSubTags = (tag?.children.length ?? 0) > 0;
  // Exclude the tag and its descendants — reassigning into the subtree being deleted is invalid.
  const excludeIds = tag ? new Set(subtreeIds(tag)) : new Set<string>();
  const options = tagNodesToOptions(treeNodes, excludeIds);

  function handleClose() {
    setReassignTo(undefined);
    onClose();
  }

  function handleDelete() {
    if (!tag) return;
    deleteTag.mutate(
      {
        id: tag.id,
        reassignTo: affectedCount > 0 ? reassignTo : undefined,
      },
      {
        onSuccess: () => {
          handleClose();
          onDeleted?.();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("Delete “{{name}}”?", {
              name: tag?.name,
            })}
          </DialogTitle>
          <DialogDescription>
            {affectedCount > 0
              ? t("{{bookmarks}} bookmarks and {{sections}} tagged sections reference this tag or its sub-tags.", {
                bookmarks: bookmarkCount,
                sections: sectionCount,
              })
              : t("No bookmarks or sections reference this tag.")}
            {hasSubTags ? ` ${t("Its sub-tags will also be deleted.")}` : ""}
          </DialogDescription>
        </DialogHeader>

        {affectedCount > 0 && options.length > 0
          ? (
            <div className="space-y-2">
              <Label htmlFor="reassign-tag">{t("Reassign bookmarks & sections to… (optional)")}</Label>
              <TreeCombobox
                id="reassign-tag"
                options={options}
                value={reassignTo}
                onValueChange={setReassignTo}
                placeholder={t("Leave blank to remove the tag")}
                searchPlaceholder={t("Search tags…")}
                emptyText={t("No other tags.")}
              />
              <p className="text-xs text-muted-foreground">
                {t("Leaving this blank deletes the tag and removes it from those bookmarks and sections.")}
              </p>
            </div>
          )
          : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("Cancel")}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={deleteTag.isPending}
            onClick={handleDelete}
          >
            {deleteTag.isPending ? t("Deleting…") : t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The tag "Danger zone" delete affordance — a destructive button that opens {@link DeleteTagDialog}, so
 * deleting a tag can reassign its (and its sub-tags') bookmark memberships + section tag references to a
 * replacement tag instead of dropping them. Rendered inside `WorkbenchRouteTab`'s danger-zone box via the
 * tag descriptor's `renderDeleteAffordance`.
 */
export function TagDeleteAffordance({
  entity, onDeleted,
}: { entity: TagNode;
  onDeleted: () => void; }) {
  const {
    t,
  } = useTranslation();
  const {
    data: treeNodes,
  } = useTagTree();
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="
          border-destructive/50 text-destructive
          hover:bg-destructive/10 hover:text-destructive
        "
        onClick={() => setDeleting(true)}
      >
        {t("Delete")}
      </Button>
      <DeleteTagDialog
        tag={deleting ? entity : null}
        treeNodes={treeNodes ?? []}
        onClose={() => setDeleting(false)}
        onDeleted={onDeleted}
      />
    </>
  );
}
