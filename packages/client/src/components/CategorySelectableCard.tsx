import type { Category } from "@eesimple/types";

import { CategoryCard } from "./CategoryCard";

import { RowCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A category row card with a selection overlay when in bulk-select mode. */
export function CategorySelectableCard({
  category,
  selected,
  inSelectionMode,
  onSelectToggle,
}: {
  category: Category;
  selected: boolean;
  inSelectionMode: boolean;
  onSelectToggle: () => void;
}) {
  return (
    <RowCard
      className={cn("group relative p-4", selected && "ring-2 ring-primary")}
    >
      {(inSelectionMode && !category.builtIn)
        ? (
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={selected ? `Deselect ${category.name}` : `Select ${category.name}`}
            onClick={onSelectToggle}
          />
        )
        : null}
      <CategoryCard category={category} />
    </RowCard>
  );
}
