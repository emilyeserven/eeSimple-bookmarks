import type { TagNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { useState } from "react";

import { Pencil } from "lucide-react";
import { z } from "zod";

import { useCreateTag, useDeleteTag, useUpdateTag } from "../hooks/useTags";
import { useAppForm } from "../lib/form";
import { flattenTree, subtreeIds } from "../lib/tagTree";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Sentinel for the "(root)" option, since Radix Select forbids an empty-string value. */
const ROOT = "__root__";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  parent: z.string(),
});

const childSchema = z.object({
  childName: z.string().trim().min(1, "Name is required"),
});

interface TagDrawerProps {
  /** The tag this drawer describes. */
  node: TagNode;
  /** The full root tree, used to build reparent options and resolve the parent name. */
  allTags: TagNode[];
  /** The trigger element (e.g. a pencil button or a table row). */
  children: ReactNode;
}

/**
 * Right-side drawer for a single tag: read-only info by default, toggles into an edit form,
 * lists children in a table, and lets you add a child or delete the tag. Opening a child row
 * spawns another (stacked) drawer.
 */
export function TagDrawer({
  node, allTags, children,
}: TagDrawerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setMode("view");
      }}
    >
      {/* The trigger is supplied by the caller (pencil button or child row). */}
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent
        side="right"
        className="overflow-hidden"
      >
        <SheetHeader
          className="
            flex-row items-center justify-between gap-2 space-y-0 pr-12
          "
        >
          <SheetTitle className="truncate">{node.name}</SheetTitle>
          {mode === "view"
            ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMode("edit")}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            )
            : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode("view")}
              >
                Cancel
              </Button>
            )}
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4">
          {mode === "view"
            ? (
              <TagViewInfo
                node={node}
                allTags={allTags}
              />
            )
            : (
              <TagEditForm
                node={node}
                allTags={allTags}
                onDone={() => setMode("view")}
              />
            )}

          {node.children.length > 0
            ? (
              <TagChildrenTable
                node={node}
                allTags={allTags}
              />
            )
            : null}
        </div>

        <SheetFooter className="gap-4">
          <AddChildForm node={node} />
          <DeleteTagButton
            node={node}
            onDeleted={() => setOpen(false)}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Read-only summary of a tag. */
function TagViewInfo({
  node, allTags,
}: {
  node: TagNode;
  allTags: TagNode[];
}) {
  const parent = node.parentId
    ? flattenTree(allTags).find(item => item.node.id === node.parentId)?.node
    : null;

  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Name</dt>
      <dd className="font-medium">{node.name}</dd>

      <dt className="text-muted-foreground">Parent</dt>
      <dd>{parent ? parent.name : "(root)"}</dd>

      <dt className="text-muted-foreground">Children</dt>
      <dd>{node.children.length}</dd>

      <dt className="text-muted-foreground">Created</dt>
      <dd>{new Date(node.createdAt).toLocaleDateString()}</dd>
    </dl>
  );
}

/** Rename + reparent form, shown when the drawer is in edit mode. */
function TagEditForm({
  node, allTags, onDone,
}: {
  node: TagNode;
  allTags: TagNode[];
  onDone: () => void;
}) {
  const updateTag = useUpdateTag();

  // A tag cannot be reparented under itself or any of its descendants.
  const forbidden = new Set(subtreeIds(node));
  const parentOptions = [
    {
      value: ROOT,
      label: "(root)",
    },
    ...flattenTree(allTags)
      .filter(item => !forbidden.has(item.node.id))
      .map(item => ({
        value: item.node.id,
        label: `${"– ".repeat(item.depth)}${item.node.name}`,
      })),
  ];

  const form = useAppForm({
    defaultValues: {
      name: node.name,
      parent: node.parentId ?? ROOT,
    },
    validators: {
      onChange: editSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateTag.mutate(
        {
          id: node.id,
          input: {
            name: value.name.trim(),
            parentId: value.parent === ROOT ? null : value.parent,
          },
        },
        {
          onSuccess: onDone,
        },
      );
    },
  });

  return (
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

      <form.AppForm>
        <form.SubmitButton
          label="Save"
          pendingLabel="Saving…"
        />
      </form.AppForm>

      {updateTag.isError
        ? <p className="text-xs text-destructive">{updateTag.error.message}</p>
        : null}
    </form>
  );
}

/** Table of a tag's direct children; each row opens a nested drawer for that child. */
function TagChildrenTable({
  node, allTags,
}: {
  node: TagNode;
  allTags: TagNode[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Children</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Children</th>
          </tr>
        </thead>
        <tbody>
          {node.children.map(child => (
            <TagDrawer
              key={child.id}
              node={child}
              allTags={allTags}
            >
              <tr
                className="
                  cursor-pointer border-b
                  hover:bg-accent
                "
              >
                <td className="py-2">{child.name}</td>
                <td className="py-2">{child.children.length}</td>
              </tr>
            </TagDrawer>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Inline form to add a child tag under the current tag. */
function AddChildForm({
  node,
}: {
  node: TagNode;
}) {
  const createTag = useCreateTag();

  const form = useAppForm({
    defaultValues: {
      childName: "",
    },
    validators: {
      onChange: childSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createTag.mutate({
        name: value.childName.trim(),
        parentId: node.id,
      });
      form.reset();
    },
  });

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="childName">
        {field => (
          <field.TextField
            label="Add child tag"
            placeholder="New child tag name"
            className="flex-1"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label="Add" />
      </form.AppForm>
    </form>
  );
}

/** Destructive button that deletes the tag (cascades to children) and closes the drawer. */
function DeleteTagButton({
  node, onDeleted,
}: {
  node: TagNode;
  onDeleted: () => void;
}) {
  const deleteTag = useDeleteTag();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="
        self-start text-destructive
        hover:text-destructive
      "
      onClick={() => deleteTag.mutate(node.id, {
        onSuccess: onDeleted,
      })}
    >
      Delete tag
    </Button>
  );
}

interface TagCreateDrawerProps {
  /** The trigger element (e.g. a "New tag" button). */
  children: ReactNode;
}

/** Right-side drawer for creating a new root tag. */
export function TagCreateDrawer({
  children,
}: TagCreateDrawerProps) {
  const [open, setOpen] = useState(false);
  const createTag = useCreateTag();

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: nameSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createTag.mutate(
        {
          name: value.name.trim(),
          parentId: null,
        },
        {
          onSuccess: () => {
            form.reset();
            setOpen(false);
          },
        },
      );
    },
  });

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New tag</SheetTitle>
        </SheetHeader>

        <form
          className="space-y-4 px-4"
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
                placeholder="New root tag name"
              />
            )}
          </form.AppField>
          <form.AppForm>
            <form.SubmitButton
              label="Add tag"
              pendingLabel="Adding…"
            />
          </form.AppForm>
          {createTag.isError
            ? <p className="text-xs text-destructive">{createTag.error.message}</p>
            : null}
        </form>

        <SheetFooter>
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
            >Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
