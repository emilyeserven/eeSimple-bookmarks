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
}

export function AddTagModal({
  open, onOpenChange,
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
          <DialogTitle>New tag</DialogTitle>
          <DialogDescription>
            Create a root tag or a subtag under an existing parent.
          </DialogDescription>
        </DialogHeader>

        <TagForm
          allTags={tree ?? []}
          submitLabel="Add tag"
          pendingLabel="Adding…"
          SubmitWrapper={DialogFooter}
          isError={createTag.isError}
          errorMessage={createTag.error?.message}
          onSubmit={({
            name, parentId,
          }) => createTag.mutate(
            {
              name,
              parentId,
            },
            {
              onSuccess: () => onOpenChange(false),
            },
          )}
        />
      </DialogContent>
    </Dialog>
  );
}
