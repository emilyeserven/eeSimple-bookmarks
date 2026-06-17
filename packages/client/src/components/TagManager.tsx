import type { FlatTag } from "../lib/tagTree";

import { z } from "zod";

import { useCreateTag, useDeleteTag, useTagTree, useUpdateTag } from "../hooks/useTags";
import { useAppForm } from "../lib/form";
import { flattenTree, subtreeIds } from "../lib/tagTree";

import { Button } from "@/components/ui/button";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const childSchema = z.object({
  childName: z.string().trim().min(1, "Name is required"),
});

/** Full tag-taxonomy management: create, rename, reparent, and delete tags. */
export function TagManager() {
  const {
    data: tree, isLoading, error,
  } = useTagTree();
  const createTag = useCreateTag();

  const flat = tree ? flattenTree(tree) : [];

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
      createTag.mutate({
        name: value.name.trim(),
        parentId: null,
      });
      form.reset();
    },
  });

  return (
    <section className="space-y-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="New root tag"
              placeholder="New root tag name"
              className="flex-1"
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Add tag" />
        </form.AppForm>
      </form>

      {isLoading ? <p className="text-muted-foreground">Loading tags…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && flat.length === 0
        ? <p className="text-muted-foreground">No tags yet. Add one above.</p>
        : null}

      <ul
        className="divide-y rounded-lg border bg-card"
      >
        {flat.map(item => (
          <TagRow
            key={item.node.id}
            item={item}
            allTags={flat}
          />
        ))}
      </ul>
    </section>
  );
}

interface TagRowProps {
  item: FlatTag;
  allTags: FlatTag[];
}

function TagRow({
  item, allTags,
}: TagRowProps) {
  const {
    node, depth,
  } = item;
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const createTag = useCreateTag();

  // A tag cannot be reparented under itself or any of its descendants.
  const forbidden = new Set(subtreeIds(node));
  const parentChoices = allTags.filter(other => !forbidden.has(other.node.id));

  const renameForm = useAppForm({
    defaultValues: {
      name: node.name,
    },
    validators: {
      onChange: nameSchema,
    },
    onSubmit: ({
      value,
    }) => {
      const next = value.name.trim();
      if (!next || next === node.name) return;
      updateTag.mutate({
        id: node.id,
        input: {
          name: next,
        },
      });
    },
  });

  const childForm = useAppForm({
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
      childForm.reset();
    },
  });

  function reparent(value: string) {
    updateTag.mutate({
      id: node.id,
      input: {
        parentId: value === "" ? null : value,
      },
    });
  }

  return (
    <li
      className="flex flex-wrap items-center gap-2 px-3 py-2"
      style={{
        paddingLeft: `${0.75 + depth * 1.25}rem`,
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void renameForm.handleSubmit();
        }}
      >
        <renameForm.AppField name="name">
          {field => (
            <field.TextField
              label={`Rename ${node.name}`}
              hideLabel
              className="w-auto"
              inputClassName="h-8 w-auto"
              onBlur={() => void renameForm.handleSubmit()}
            />
          )}
        </renameForm.AppField>
      </form>

      <select
        className="
          h-8 rounded-md border bg-transparent px-2 text-sm shadow-xs
          focus-visible:border-ring focus-visible:ring-[3px]
          focus-visible:ring-ring/50 focus-visible:outline-none
        "
        value={node.parentId ?? ""}
        onChange={event => reparent(event.target.value)}
        aria-label={`Parent of ${node.name}`}
      >
        <option value="">(root)</option>
        {parentChoices.map(choice => (
          <option
            key={choice.node.id}
            value={choice.node.id}
          >
            {`${"– ".repeat(choice.depth)}${choice.node.name}`}
          </option>
        ))}
      </select>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void childForm.handleSubmit();
        }}
      >
        <childForm.AppField name="childName">
          {field => (
            <field.TextField
              label={`Add child tag under ${node.name}`}
              hideLabel
              placeholder="Add child…"
              className="w-auto"
              inputClassName="h-8 w-auto"
            />
          )}
        </childForm.AppField>
      </form>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => deleteTag.mutate(node.id)}
        className="
          text-destructive
          hover:text-destructive
        "
      >
        Delete
      </Button>

      {updateTag.isError
        ? <span className="text-xs text-destructive">{updateTag.error.message}</span>
        : null}
    </li>
  );
}
