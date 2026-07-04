import type { BookmarkSort } from "@/lib/bookmarkSort";

import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useListingPageContext } from "./useListingPageContext";

import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";

/** A CommandItem that shows a leading check mark when `checked`. */
function CheckedCommandItem({
  value,
  checked,
  onSelect,
}: {
  value: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
    >
      {checked && <CheckIcon className="text-primary" />}
      {value}
    </CommandItem>
  );
}

/** The fixed sort choices offered on sortable listing pages. */
const SORT_ITEMS: { value: string;
  label: string;
  sort: BookmarkSort; }[] = [
  {
    value: "Sort by Title A to Z",
    label: "Sort by Title (A → Z)",
    sort: {
      primary: {
        field: "title",
        direction: "asc",
      },
    },
  },
  {
    value: "Sort by Title Z to A",
    label: "Sort by Title (Z → A)",
    sort: {
      primary: {
        field: "title",
        direction: "desc",
      },
    },
  },
  {
    value: "Sort by Date Added Newest",
    label: "Sort by Date Added (Newest)",
    sort: {
      primary: {
        field: "createdAt",
        direction: "desc",
      },
    },
  },
  {
    value: "Sort by Date Added Oldest",
    label: "Sort by Date Added (Oldest)",
    sort: {
      primary: {
        field: "createdAt",
        direction: "asc",
      },
    },
  },
  {
    value: "Sort by Date Updated Newest",
    label: "Sort by Date Updated (Newest)",
    sort: {
      primary: {
        field: "updatedAt",
        direction: "desc",
      },
    },
  },
  {
    value: "Sort by Date Updated Oldest",
    label: "Sort by Date Updated (Oldest)",
    sort: {
      primary: {
        field: "updatedAt",
        direction: "asc",
      },
    },
  },
];

/**
 * The "Current Page" display controls for the registered listing page — the palette twin of the
 * header's `ListingDisplayControls` / `DisplayOptionsPopover`. Renders nothing when the current
 * route isn't a listing page.
 */
export function ListingPageCommandGroup({
  listingCtx,
  onClose,
}: {
  listingCtx: ReturnType<typeof useListingPageContext>;
  onClose: () => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!listingCtx.listingPage) return null;

  const pick = (apply: () => void) => () => {
    apply();
    onClose();
  };

  const disableSelectMode = t("Disable Select Mode");
  const enableSelectMode = t("Enable Select Mode");

  return (
    <>
      <CommandGroup heading={t("Current Page")}>
        <CheckedCommandItem
          value={t("Cards View")}
          checked={listingCtx.currentViewMode === "cards"}
          onSelect={pick(() => listingCtx.setViewMode("cards"))}
        />
        <CheckedCommandItem
          value={t("Table View")}
          checked={listingCtx.currentViewMode === "table"}
          onSelect={pick(() => listingCtx.setViewMode("table"))}
        />
        {listingCtx.currentViewMode === "cards" && ([1, 2, 3, 4] as const).map(n => (
          <CheckedCommandItem
            key={n}
            value={t(n === 1 ? "{{count}} Column" : "{{count}} Columns", {
              count: n,
            })}
            checked={listingCtx.currentColumns === n}
            onSelect={pick(() => listingCtx.setColumns(n))}
          />
        ))}
        {listingCtx.listingPage.hasFilters && (
          <>
            <CheckedCommandItem
              value={t("Filters in Sidebar")}
              checked={listingCtx.filterLocation === "sidebar"}
              onSelect={pick(() => listingCtx.setFilterLocation("sidebar"))}
            />
            <CheckedCommandItem
              value={t("Filters in Drawer")}
              checked={listingCtx.filterLocation === "drawer"}
              onSelect={pick(() => listingCtx.setFilterLocation("drawer"))}
            />
            <CheckedCommandItem
              value={t("Hide Filters")}
              checked={listingCtx.filterLocation === "hide"}
              onSelect={pick(() => listingCtx.setFilterLocation("hide"))}
            />
          </>
        )}
        {listingCtx.listingPage.hasSort && (
          <>
            {SORT_ITEMS.map(item => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={pick(() => listingCtx.setSort(item.sort))}
              >
                {t(item.label)}
              </CommandItem>
            ))}
            <CommandItem
              value="Sort Randomly"
              onSelect={pick(() => listingCtx.setSort({
                random: true,
                seed: Math.random(),
              }))}
            >
              {t("Sort Randomly")}
            </CommandItem>
            {listingCtx.currentSort != null && (
              <CommandItem
                value="Clear Sort"
                onSelect={pick(() => listingCtx.clearSort())}
              >
                {t("Clear Sort")}
              </CommandItem>
            )}
          </>
        )}
        {listingCtx.bulkSelectPageKey && (
          <CommandItem
            value={listingCtx.selectionMode ? disableSelectMode : enableSelectMode}
            onSelect={pick(() => listingCtx.setSelectionMode(!listingCtx.selectionMode))}
          >
            {listingCtx.selectionMode ? disableSelectMode : enableSelectMode}
          </CommandItem>
        )}
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}
