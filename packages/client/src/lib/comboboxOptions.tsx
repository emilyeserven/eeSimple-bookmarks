import type { ReactNode } from "react";

import { CategoryIcon } from "@/lib/icons";

export interface IconComboboxOption {
  value: string;
  label: string;
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
