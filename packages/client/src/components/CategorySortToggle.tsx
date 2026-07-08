import type { CategorySortMode } from "../lib/categorySort";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";

import { useUiStore } from "@/stores/uiStore";

const CATEGORY_SORT_MODES: CategorySortMode[] = ["name-asc", "name-desc", "count-desc", "count-asc"];

function isCategorySortMode(value: string | undefined): value is CategorySortMode {
  return value != null && (CATEGORY_SORT_MODES as string[]).includes(value);
}

/**
 * The Categories listing's sort-mode control, rendered in the search box's `sort` slot (like the
 * Websites/Locations sort dropdowns). Offers Name (A–Z / Z–A) and bookmark-count (Most / Fewest)
 * ordering. Reads/writes the `uiStore.categorySortMode` pref consumed by `useCategorySortedItems`
 * (`hooks/useCategoryListing.ts`).
 */
export function CategorySortToggle() {
  const {
    t,
  } = useTranslation();
  const mode = useUiStore(state => state.categorySortMode);
  const setCategorySortMode = useUiStore(state => state.setCategorySortMode);

  const options = [
    {
      value: "name-asc",
      label: t("Name (A–Z)"),
    },
    {
      value: "name-desc",
      label: t("Name (Z–A)"),
    },
    {
      value: "count-desc",
      label: t("Most bookmarks"),
    },
    {
      value: "count-asc",
      label: t("Fewest bookmarks"),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span
        className="
          hidden text-sm text-muted-foreground
          sm:inline
        "
      >{t("Sort")}
      </span>
      <div className="w-44">
        <Combobox
          options={options}
          value={mode}
          onValueChange={(value) => {
            if (isCategorySortMode(value)) {
              setCategorySortMode(value);
            }
          }}
          aria-label={t("Sort categories")}
        />
      </div>
    </div>
  );
}
