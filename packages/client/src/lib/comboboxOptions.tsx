import type { MediaTypeNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { flattenTree } from "./tagTree";

import { CategoryIcon } from "@/lib/icons";

export interface IconComboboxOption {
  value: string;
  label: string;
  depth?: number;
  icon: ReactNode;
}

/**
 * Build `{ value, label, icon }` combobox options for an icon-bearing taxonomy row (Category,
 * MediaType, …). Shared by the auto-save general forms so the default category / media-type pickers
 * don't re-list the same `.map()` + `<CategoryIcon>` block.
 */
export function iconComboboxOptions(
  items: { id: string;
    name: string;
    icon: string | null; }[],
): IconComboboxOption[] {
  return items.map(item => ({
    value: item.id,
    label: item.name,
    icon: (
      <CategoryIcon
        name={item.icon}
        className="size-4 shrink-0"
      />
    ),
  }));
}

/**
 * Build depth-aware combobox options from a media type tree. Roots appear first; their children are
 * indented one level. Mirrors how the filter sidebar uses `TreeMultiCombobox` for media types, but
 * for single-select `Combobox` / `ComboboxField` pickers (which use `depth` for indentation).
 */
export function mediaTypeTreeComboboxOptions(tree: MediaTypeNode[]): IconComboboxOption[] {
  return flattenTree(tree).map(({
    node, depth,
  }) => ({
    value: node.id,
    label: node.name,
    depth,
    icon: (
      <CategoryIcon
        name={node.icon}
        className="size-4 shrink-0"
      />
    ),
  }));
}
