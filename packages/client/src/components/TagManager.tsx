import type { FlatTag } from "../lib/tagTree";

import { useState } from "react";

import { useCreateTag, useDeleteTag, useTagTree, useUpdateTag } from "../hooks/useTags";
import { flattenTree, subtreeIds } from "../lib/tagTree";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Full tag-taxonomy management: create, rename, reparent, and delete tags. */
export function TagManager() {
  const {
    data: tree, isLoading, error,
  } = useTagTree();
  const createTag = useCreateTag();
  const [newRootName, setNewRootName] = useState("");

  const flat = tree ? flattenTree(tree) : [];

  function addRoot() {
    const name = newRootName.trim();
    if (!name) return;
    createTag.mutate({
      name,
      parentId: null,
    });
    setNewRootName("");
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New root tag name"
          value={newRootName}
          onChange={event => setNewRootName(event.target.value)}
          onKeyDown={event => event.key === "Enter" && addRoot()}
        />
        <Button
          type="button"
          onClick={addRoot}
          disabled={!newRootName.trim()}
        >
          Add tag
        </Button>
      </div>

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
  const [name, setName] = useState(node.name);
  const [childName, setChildName] = useState("");

  // A tag cannot be reparented under itself or any of its descendants.
  const forbidden = new Set(subtreeIds(node));
  const parentChoices = allTags.filter(other => !forbidden.has(other.node.id));

  function rename() {
    const next = name.trim();
    if (!next || next === node.name) return;
    updateTag.mutate({
      id: node.id,
      input: {
        name: next,
      },
    });
  }

  function reparent(value: string) {
    updateTag.mutate({
      id: node.id,
      input: {
        parentId: value === "" ? null : value,
      },
    });
  }

  function addChild() {
    const child = childName.trim();
    if (!child) return;
    createTag.mutate({
      name: child,
      parentId: node.id,
    });
    setChildName("");
  }

  return (
    <li
      className="flex flex-wrap items-center gap-2 px-3 py-2"
      style={{
        paddingLeft: `${0.75 + depth * 1.25}rem`,
      }}
    >
      <Input
        className="h-8 w-auto"
        value={name}
        onChange={event => setName(event.target.value)}
        onBlur={rename}
        onKeyDown={event => event.key === "Enter" && rename()}
        aria-label={`Rename ${node.name}`}
      />

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

      <Input
        className="h-8 w-auto"
        placeholder="Add child…"
        value={childName}
        onChange={event => setChildName(event.target.value)}
        onKeyDown={event => event.key === "Enter" && addChild()}
        aria-label={`Add child tag under ${node.name}`}
      />

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
