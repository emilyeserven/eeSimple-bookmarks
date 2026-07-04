import type { Tag } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { TagForm } from "./TagForm";
import { useCreateEntityNames } from "../hooks/useEntityNames";
import { useCreateTag, useTagTree } from "../hooks/useTags";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (tag: Tag) => void;
  /** When false, hide the parent select and fix the parent to `defaultParentId` (header quick-add). */
  showParent?: boolean;
  /** Pre-selected / fixed parent id. Used by the header's "New sub-tag" button. */
  defaultParentId?: string | null;
}

export function AddTagModal({
  open, onOpenChange, onCreated, showParent = true, defaultParentId = null,
}: AddTagModalProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree,
  } = useTagTree();
  const createTag = useCreateTag();
  const createNames = useCreateEntityNames();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{showParent ? t("New tag") : t("New sub-tag")}</DialogTitle>
          <DialogDescription>
            {showParent
              ? t("Create a root tag or a subtag under an existing parent.")
              : t("Create a subtag under the current tag.")}
          </DialogDescription>
        </DialogHeader>

        <TagForm
          allTags={tree ?? []}
          showParent={showParent}
          defaultParentId={defaultParentId}
          submitLabel={t("Add tag")}
          pendingLabel={t("Adding…")}
          SubmitWrapper={DialogFooter}
          isError={createTag.isError}
          errorMessage={createTag.error?.message}
          onSubmit={({
            name, names, parentId,
          }) => createTag.mutate(
            {
              name,
              parentId,
            },
            {
              onSuccess: (tag) => {
                if (names.length > 0) {
                  createNames.mutate({
                    ownerType: "tag",
                    ownerId: tag.id,
                    entries: names,
                  });
                }
                onCreated?.(tag);
                onOpenChange(false);
              },
            },
          )}
          renderParentCreateModal={({
            open: nestedOpen, onOpenChange: setNestedOpen, onCreated: onNestedCreated,
          }) => (
            <AddTagModal
              open={nestedOpen}
              onOpenChange={setNestedOpen}
              onCreated={onNestedCreated}
            />
          )}
        />
      </DialogContent>
    </Dialog>
  );
}
