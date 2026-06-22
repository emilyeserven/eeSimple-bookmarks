import type { DrawerMode } from "@/lib/drawerSearch";
import type { TagNode } from "@eesimple/types";

import { useState } from "react";

import { Pencil } from "lucide-react";
import { z } from "zod";

import { usePanelControls } from "./usePanelControls";
import { usePanelDismissAfterDelete } from "./usePanelDismissAfterDelete";
import { useCreateTag, useDeleteTag } from "../../hooks/useTags";
import { useAppForm } from "../../lib/form";
import { flattenTree, subtreeIds } from "../../lib/tagTree";
import { TagGeneralForm } from "../TagGeneralForm";

import { Button } from "@/components/ui/button";

const childSchema = z.object({
  childName: z.string().trim().min(1, "Name is required"),
});

interface TagEditorProps {
  node: TagNode;
  allTags: TagNode[];
  initialMode: DrawerMode;
}

/** View/edit a tag: read-only info by default, an edit form, children navigation, add/delete. */
export function TagEditor({
  node, allTags, initialMode,
}: TagEditorProps) {
  const dismiss = usePanelDismissAfterDelete();
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-xl font-semibold">{node.name}</h2>
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
              Done
            </Button>
          )}
      </div>

      {mode === "view"
        ? (
          <TagViewInfo
            node={node}
            allTags={allTags}
          />
        )
        : (
          // Reuse the same auto-save form the main-app edit tab renders — not a panel-only editor.
          <TagGeneralForm
            node={node}
            allTags={allTags}
            forbiddenIds={new Set(subtreeIds(node))}
          />
        )}

      {node.children.length > 0
        ? <TagChildrenTable node={node} />
        : null}

      <div className="flex flex-col gap-4 border-t pt-4">
        <AddChildForm node={node} />
        <DeleteTagButton
          node={node}
          onDeleted={dismiss}
        />
      </div>
    </div>
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

/** Table of a tag's direct children; each row re-targets the panel at that child. */
function TagChildrenTable({
  node,
}: {
  node: TagNode;
}) {
  const {
    openTag,
  } = usePanelControls();

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
            <tr
              key={child.id}
              className="
                cursor-pointer border-b
                hover:bg-accent
              "
              onClick={() => openTag(child.id)}
            >
              <td className="py-2">{child.name}</td>
              <td className="py-2">{child.children.length}</td>
            </tr>
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

/** Destructive button that deletes the tag (cascades to children) and closes the panel. */
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
