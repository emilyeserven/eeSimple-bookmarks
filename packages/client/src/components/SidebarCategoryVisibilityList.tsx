import { useCategories } from "../hooks/useCategories";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CategoryIcon } from "@/lib/icons";

type CategoryDisplayMode = "visible" | "see-more" | "hidden";

interface SidebarCategoryVisibilityListProps {
  onSetMode: (id: string, mode: CategoryDisplayMode) => void;
  hiddenCategoryIds: string[];
  seeMoreCategoryIds: string[];
}

/**
 * The per-category visibility radio rows shown inside the Categories sub-section of
 * `DisplaySidebarSettings`. Loads the categories itself and renders the Default / See More /
 * Listing-only toggle for each.
 */
export function SidebarCategoryVisibilityList({
  onSetMode, hiddenCategoryIds, seeMoreCategoryIds,
}: SidebarCategoryVisibilityListProps) {
  const {
    data: categories,
  } = useCategories();

  if (!categories || categories.length === 0) {
    return <p className="text-sm text-muted-foreground">No categories yet.</p>;
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => {
        const mode: CategoryDisplayMode = hiddenCategoryIds.includes(category.id)
          ? "hidden"
          : seeMoreCategoryIds.includes(category.id)
            ? "see-more"
            : "visible";
        return (
          <div
            key={category.id}
            className="flex items-center justify-between gap-2"
          >
            <span
              className="flex items-center gap-1.5 truncate text-sm"
            >
              <CategoryIcon name={category.icon} />
              {category.name}
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              className="gap-0"
              value={mode}
              onValueChange={value => value && onSetMode(category.id, value as CategoryDisplayMode)}
            >
              <ToggleGroupItem
                value="visible"
                className="
                  -me-px rounded-e-none
                  focus-visible:z-10
                "
              >
                Default
              </ToggleGroupItem>
              <ToggleGroupItem
                value="see-more"
                className="
                  -me-px rounded-none
                  focus-visible:z-10
                "
              >
                See More
              </ToggleGroupItem>
              <ToggleGroupItem
                value="hidden"
                className="
                  rounded-s-none
                  focus-visible:z-10
                "
              >
                Listing only
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        );
      })}
    </div>
  );
}
