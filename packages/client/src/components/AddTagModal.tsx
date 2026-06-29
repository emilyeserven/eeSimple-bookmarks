import type { Tag } from "@eesimple/types";

import { TagForm } from "./TagForm";
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
    data: tree,
  } = useTagTree();
  const createTag = useCreateTag();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{showParent ? "New tag" : "New sub-tag"}</DialogTitle>
          <DialogDescription>
            {showParent
              ? "Create a root tag or a subtag under an existing parent."
              : "Create a subtag under the current tag."}
          </DialogDescription>
        </DialogHeader>

        <TagForm
          allTags={tree ?? []}
          showParent={showParent}
          defaultParentId={defaultParentId}
          submitLabel="Add tag"
          pendingLabel="Adding…"
          SubmitWrapper={DialogFooter}
          isError={createTag.isError}
          errorMessage={createTag.error?.message}
          onSubmit={({
            name, romanizedName, parentId,
          }) => createTag.mutate(
            {
              name,
              romanizedName,
              parentId,
            },
            {
              onSuccess: (tag) => {
                onCreated?.(tag);
                onOpenChange(false);
              },
            },
          )}
        />
      </DialogContent>
    </Dialog>
  );
}
