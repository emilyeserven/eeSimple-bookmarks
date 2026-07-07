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
  names?: EntityName[];
  icon: ReactNode;
}

/**
 * Renders a row's display name. Pass `useBuiltInName()` (from `@/lib/builtInName`) to translate a
 * seeded built-in name at render; the default leaves every name verbatim so existing callers and
 * user-created rows are unchanged. These builders are pure (no `t`), so the translator is threaded
 * in rather than called here.
 */
export type OptionNameFn = (row: { name: string;
  builtIn?: boolean; }) => string;

const verbatimName: OptionNameFn = row => row.name;

/**
 * Search text for an option. A built-in row whose label may be translated keeps its English seed
 * `name` searchable (folded in alongside the multilingual `names` variants), so an English-typed
 * query still matches a Japanese label — the invariant documented in `lib/builtInName.ts`.
 */
function optionSearchAlias(row: { name: string;
  builtIn?: boolean;
  names?: EntityName[] | null; }): string | undefined {
  const names = row.builtIn
    ? [{
      value: row.name,
    } as EntityName, ...(row.names ?? [])]
    : row.names;
  return buildSearchAlias(names);
}

/**
 * Build `{ value, label, icon }` combobox options for an icon-bearing taxonomy row (Category,
 * MediaType, …). Shared by the auto-save general forms so the default category / media-type pickers
 * don't re-list the same `.map()` + `<CategoryIcon>` block. Every language-labelled name variant is
 * carried as `searchAlias` so the picker search matches any of them. Pass `nameOf` (e.g.
 * `useBuiltInName()`) to translate seeded built-in names.
 */
export function iconComboboxOptions(
  items: { id: string;
    name: string;
    icon: string | null;
    builtIn?: boolean;
    names?: EntityName[]; }[],
  nameOf: OptionNameFn = verbatimName,
): IconComboboxOption[] {
  return items.map(item => ({
    value: item.id,
    label: nameOf(item),
    searchAlias: optionSearchAlias(item),
    names: item.names,
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
 * media-type icon (which is why it lives here, in a `.tsx`, rather than in `tagTree.ts`). Its
 * multilingual names (when present) are carried as `searchAlias` so the picker search matches them too.
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
      names: node.names,
    }));
}

/**
 * Convert a `MediaTypeNode` tree into `TreeComboboxOption[]`, excluding any node the user has
 * **hidden** from pickers. Hidden nodes are pruned *and hoisted*: a hidden parent (e.g. Audio) is
 * spliced out but its still-visible children (Podcast, Music) are lifted up to its level, so hiding
 * a parent never vanishes a visible child. Hidden values stay resolvable everywhere else — they're
 * only kept out of the option list here. Do NOT route the reparent/parent picker through this
 * builder; that one must still see every type.
 */
export function mediaTypeNodesToOptions(
  nodes: MediaTypeNode[],
  nameOf: OptionNameFn = verbatimName,
): TreeComboboxOption[] {
  return nodes.flatMap((node) => {
    const children = mediaTypeNodesToOptions(node.children, nameOf);
    if (node.hidden) return children;
    return [
      {
        value: node.id,
        label: nameOf(node),
        searchAlias: optionSearchAlias(node),
        names: node.names,
        icon: (
          <CategoryIcon
            name={node.icon}
            className="size-4 shrink-0"
          />
        ),
        children,
      },
    ];
  });
}
