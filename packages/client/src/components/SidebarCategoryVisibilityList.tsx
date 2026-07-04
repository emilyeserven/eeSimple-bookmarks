import { useTranslation } from "react-i18next";

import { useCategories } from "../hooks/useCategories";

import { SegmentedToggleRow } from "@/components/SegmentedToggleRow";
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
    t,
  } = useTranslation();
  const {
    data: categories,
  } = useCategories();

  const categoryModeOptions: { value: CategoryDisplayMode;
    label: string; }[] = [
    {
      value: "visible",
      label: t("Default"),
    },
    {
      value: "see-more",
      label: t("See More"),
    },
    {
      value: "hidden",
      label: t("Listing only"),
    },
  ];

  if (!categories || categories.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("No categories yet.")}</p>;
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
          <SegmentedToggleRow
            key={category.id}
            label={category.name}
            icon={<CategoryIcon name={category.icon} />}
            options={categoryModeOptions}
            value={mode}
            onChange={next => onSetMode(category.id, next)}
          />
        );
      })}
    </div>
  );
}
