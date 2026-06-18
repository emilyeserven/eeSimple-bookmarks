import { z } from "zod";

import { useCreateTag, useTagTree } from "../hooks/useTags";
import { useAppForm } from "../lib/form";
import { flattenTree } from "../lib/tagTree";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ROOT = "__root__";

const createTagSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  parent: z.string(),
});

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

  const parentOptions = [
    {
      value: ROOT,
      label: "(root)",
    },
    ...flattenTree(tree ?? []).map(item => ({
      value: item.node.id,
      label: `${"– ".repeat(item.depth)}${item.node.name}`,
    })),
  ];

  const form = useAppForm({
    defaultValues: {
      name: "",
      parent: ROOT,
    },
    validators: {
      onChange: createTagSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createTag.mutate(
        {
          name: value.name.trim(),
          parentId: value.parent === ROOT ? null : value.parent,
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    },
  });

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

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                placeholder="Tag name"
              />
            )}
          </form.AppField>

          <form.AppField name="parent">
            {field => (
              <field.SelectField
                label="Parent"
                options={parentOptions}
                placeholder="Choose a parent"
              />
            )}
          </form.AppField>

          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton
                label="Add tag"
                pendingLabel="Adding…"
              />
            </form.AppForm>
          </DialogFooter>

          {createTag.isError
            ? <p className="text-xs text-destructive">{createTag.error.message}</p>
            : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
