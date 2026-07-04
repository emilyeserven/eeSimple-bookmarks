import type { ComboboxOption } from "@/components/Combobox";
import type { TreeComboboxOption } from "@/components/TreeMultiCombobox";
import type { EntityName, GenreMoodNode, MediaTypeNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { buildSearchAlias } from "./searchAlias";
import { flattenTree } from "./tagTree";

import { CategoryIcon } from "@/lib/icons";

export interface IconComboboxOption {
  value: string;
  label: string;
  depth?: number;
  searchAlias?: string;
  icon: ReactNode;
}

/**
 * Build `{ value, label, icon }` combobox options for an icon-bearing taxonomy row (Category,
 * MediaType, …). Shared by the auto-save general forms so the default category / media-type pickers
 * don't re-list the same `.map()` + `<CategoryIcon>` block. Every name variant (romanized + each
 * language-labelled name) is carried as `searchAlias` so the picker search matches any of them.
 */
export function iconComboboxOptions(
  items: { id: string;
    name: string;
    icon: string | null;
    romanizedName?: string | null;
    names?: EntityName[]; }[],
): IconComboboxOption[] {
  return items.map(item => ({
    value: item.id,
    label: item.name,
    searchAlias: buildSearchAlias(item.romanizedName, item.names),
    icon: (
      <CategoryIcon
        name={item.icon}
        className="size-4 shrink-0"
      />
    ),
  }));
}

/**
 * Convert a `MediaTypeNode` tree into `TreeComboboxOption[]` for the tree comboboxes
 * (`TreeCombobox` / `TreeMultiCombobox`), preserving nested `children` so the picker renders real
 * collapsible hierarchy. Mirrors `tagNodesToOptions`/`locationNodesToOptions` but carries the
 * media-type icon (which is why it lives here, in a `.tsx`, rather than in `tagTree.ts`). A
 * romanized name (when present) is carried as `searchAlias` so the picker search matches it too.
 */
/**
 * Build depth-aware (icon-less) combobox options from a Genres & Moods tree for a multi-select
 * picker. Roots first; children indented one level. Optionally exclude a subtree of ids (e.g. the
 * entry being edited, so it can't be attached to itself).
 */
export function genreMoodTreeComboboxOptions(
  tree: GenreMoodNode[],
  excludeIds?: Set<string>,
): ComboboxOption[] {
  return flattenTree(tree)
    .filter(({
      node,
    }) => !excludeIds?.has(node.id))
    .map(({
      node, depth,
    }) => ({
      value: node.id,
      label: node.name,
      depth,
      romanized: node.romanizedName,
    }));
}

export function mediaTypeNodesToOptions(nodes: MediaTypeNode[]): TreeComboboxOption[] {
  return nodes.map(node => ({
    value: node.id,
    label: node.name,
    searchAlias: buildSearchAlias(node.romanizedName, node.names),
    icon: (
      <CategoryIcon
        name={node.icon}
        className="size-4 shrink-0"
      />
    ),
    children: mediaTypeNodesToOptions(node.children),
  }));
}
