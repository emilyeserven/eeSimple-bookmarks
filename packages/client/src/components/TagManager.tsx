import type { FlatTag } from "../lib/tagTree";

import { useState } from "react";

import { useCreateTag, useDeleteTag, useTagTree, useUpdateTag } from "../hooks/useTags";
import { flattenTree, subtreeIds } from "../lib/tagTree";

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
        <input
          className="
            w-full rounded-md border border-slate-300 px-3 py-2 text-sm
            focus:border-blue-500 focus:outline-none
          "
          placeholder="New root tag name"
          value={newRootName}
          onChange={event => setNewRootName(event.target.value)}
          onKeyDown={event => event.key === "Enter" && addRoot()}
        />
        <button
          type="button"
          onClick={addRoot}
          disabled={!newRootName.trim()}
          className="
            rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
            hover:bg-blue-700
            disabled:opacity-50
          "
        >
          Add tag
        </button>
      </div>

      {isLoading ? <p className="text-slate-500">Loading tags…</p> : null}
      {error ? <p className="text-red-600">{error.message}</p> : null}
      {!isLoading && flat.length === 0
        ? <p className="text-slate-500">No tags yet. Add one above.</p>
        : null}

      <ul
        className="
          divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white
        "
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
      <input
        className="
          rounded-md border border-slate-300 px-2 py-1 text-sm
          focus:border-blue-500 focus:outline-none
        "
        value={name}
        onChange={event => setName(event.target.value)}
        onBlur={rename}
        onKeyDown={event => event.key === "Enter" && rename()}
        aria-label={`Rename ${node.name}`}
      />

      <select
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
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

      <input
        className="
          rounded-md border border-slate-300 px-2 py-1 text-sm
          focus:border-blue-500 focus:outline-none
        "
        placeholder="Add child…"
        value={childName}
        onChange={event => setChildName(event.target.value)}
        onKeyDown={event => event.key === "Enter" && addChild()}
        aria-label={`Add child tag under ${node.name}`}
      />

      <button
        type="button"
        onClick={() => deleteTag.mutate(node.id)}
        className="
          text-sm text-red-600
          hover:underline
        "
      >
        Delete
      </button>

      {updateTag.isError
        ? <span className="text-xs text-red-600">{updateTag.error.message}</span>
        : null}
    </li>
  );
}
