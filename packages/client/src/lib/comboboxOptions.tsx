import type { TreeComboboxOption } from "@/components/TreeMultiCombobox";
import type { MediaTypeNode } from "@eesimple/types";
import type { ReactNode } from "react";

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
 * don't re-list the same `.map()` + `<CategoryIcon>` block. A romanized name (when present) is carried
 * as `searchAlias` so the picker search matches it too.
 */
export function iconComboboxOptions(
  items: { id: string;
    name: string;
    icon: string | null;
    romanizedName?: string | null; }[],
): IconComboboxOption[] {
  return items.map(item => ({
    value: item.id,
    label: item.name,
    searchAlias: item.romanizedName ?? undefined,
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
export function mediaTypeNodesToOptions(nodes: MediaTypeNode[]): TreeComboboxOption[] {
  return nodes.map(node => ({
    value: node.id,
    label: node.name,
    searchAlias: node.romanizedName ?? undefined,
    icon: (
      <CategoryIcon
        name={node.icon}
        className="size-4 shrink-0"
      />
    ),
    children: mediaTypeNodesToOptions(node.children),
  }));
}
