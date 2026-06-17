import type { FlatNode } from "../lib/tagTree";
import type { CustomPropertyTagNode } from "@eesimple/types";

import { useState } from "react";

import {
  useCreatePropertyTag,
  useDeletePropertyTag,
  usePropertyTagTree,
  useUpdatePropertyTag,
} from "../hooks/useCustomProperties";
import { flattenTree, subtreeIds } from "../lib/tagTree";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Radix Select forbids an empty string value, so root uses this sentinel.
const ROOT_VALUE = "__root__";

interface PropertyTagManagerProps {
  propertyId: string;
}

/** Manage a tiered-tags custom property's own tier tree: create, rename, reparent, delete. */
export function PropertyTagManager({
  propertyId,
}: PropertyTagManagerProps) {
  const {
    data: tree, isLoading, error,
  } = usePropertyTagTree(propertyId);
  const createTag = useCreatePropertyTag(propertyId);
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New root tier name"
          value={newRootName}
          onChange={event => setNewRootName(event.target.value)}
          onKeyDown={event => event.key === "Enter" && addRoot()}
        />
        <Button
          type="button"
          onClick={addRoot}
          disabled={!newRootName.trim()}
        >
          Add tier
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading tiers…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && flat.length === 0
        ? <p className="text-sm text-muted-foreground">No tiers yet. Add one above.</p>
        : null}

      {flat.length > 0
        ? (
          <ul className="divide-y rounded-lg border">
            {flat.map(item => (
              <PropertyTagRow
                key={item.node.id}
                propertyId={propertyId}
                item={item}
                allTags={flat}
              />
            ))}
          </ul>
        )
        : null}
    </div>
  );
}

interface PropertyTagRowProps {
  propertyId: string;
  item: FlatNode<CustomPropertyTagNode>;
  allTags: FlatNode<CustomPropertyTagNode>[];
}

function PropertyTagRow({
  propertyId, item, allTags,
}: PropertyTagRowProps) {
  const {
    node, depth,
  } = item;
  const updateTag = useUpdatePropertyTag(propertyId);
  const deleteTag = useDeletePropertyTag(propertyId);
  const createTag = useCreatePropertyTag(propertyId);
  const [name, setName] = useState(node.name);
  const [childName, setChildName] = useState("");

  // A tier cannot be reparented under itself or any of its descendants.
  const forbidden = new Set(subtreeIds(node));
  const parentChoices = allTags.filter(other => !forbidden.has(other.node.id));

  function rename() {
    const next = name.trim();
    if (!next || next === node.name) return;
    updateTag.mutate({
      tagId: node.id,
      input: {
        name: next,
      },
    });
  }

  function reparent(value: string) {
    updateTag.mutate({
      tagId: node.id,
      input: {
        parentId: value === ROOT_VALUE ? null : value,
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

      <Select
        value={node.parentId ?? ROOT_VALUE}
        onValueChange={reparent}
      >
        <SelectTrigger
          size="sm"
          aria-label={`Parent of ${node.name}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ROOT_VALUE}>(root)</SelectItem>
          {parentChoices.map(choice => (
            <SelectItem
              key={choice.node.id}
              value={choice.node.id}
            >
              {`${"– ".repeat(choice.depth)}${choice.node.name}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        className="h-8 w-auto"
        placeholder="Add child…"
        value={childName}
        onChange={event => setChildName(event.target.value)}
        onKeyDown={event => event.key === "Enter" && addChild()}
        aria-label={`Add child tier under ${node.name}`}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive"
        onClick={() => deleteTag.mutate(node.id)}
      >
        Delete
      </Button>

      {updateTag.isError
        ? <span className="text-xs text-destructive">{updateTag.error.message}</span>
        : null}
    </li>
  );
}
