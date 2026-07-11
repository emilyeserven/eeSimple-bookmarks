import type { BookmarkSort } from "@/lib/bookmarkSort";
import type { LucideIcon } from "lucide-react";

import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpNarrowWide,
  CheckIcon,
  Columns3,
  LayoutGrid,
  ListChecks,
  Shuffle,
  Table,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useListingPageContext } from "./useListingPageContext";

import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";

/** A CommandItem with a leading identity icon and a trailing check mark when `checked`. */
function CheckedCommandItem({
  value,
  checked,
  icon: Icon,
  onSelect,
}: {
  value: string;
  checked: boolean;
  icon: LucideIcon;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
    >
      <Icon />
      {value}
      {checked && <CheckIcon className="ml-auto text-primary" />}
    </CommandItem>
  );
}

/** The fixed sort choices offered on sortable listing pages. */
const SORT_ITEMS: { value: string;
  label: string;
  icon: LucideIcon;
  sort: BookmarkSort; }[] = [
  {
    value: "Sort by Title A to Z",
    label: "Sort by Title (A → Z)",
    icon: ArrowDownAZ,
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
    icon: ArrowUpAZ,
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
    icon: ArrowDownWideNarrow,
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
    icon: ArrowUpNarrowWide,
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
    icon: ArrowDownWideNarrow,
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
    icon: ArrowUpNarrowWide,
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
 * on-page `ListingDisplayControls` (rendered under the search box). Renders nothing when the current
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
          icon={LayoutGrid}
          checked={listingCtx.currentViewMode === "cards"}
          onSelect={pick(() => listingCtx.setViewMode("cards"))}
        />
        <CheckedCommandItem
          value={t("Table View")}
          icon={Table}
          checked={listingCtx.currentViewMode === "table"}
          onSelect={pick(() => listingCtx.setViewMode("table"))}
        />
        {listingCtx.currentViewMode === "cards" && ([1, 2, 3, 4] as const).map(n => (
          <CheckedCommandItem
            key={n}
            value={t(n === 1 ? "{{count}} Column" : "{{count}} Columns", {
              count: n,
            })}
            icon={Columns3}
            checked={listingCtx.currentColumns === n}
            onSelect={pick(() => listingCtx.setColumns(n))}
          />
        ))}
        {listingCtx.listingPage.hasSort && (
          <>
            {SORT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={pick(() => listingCtx.setSort(item.sort))}
                >
                  <Icon />
                  {t(item.label)}
                </CommandItem>
              );
            })}
            <CommandItem
              value="Sort Randomly"
              onSelect={pick(() => listingCtx.setSort({
                random: true,
                seed: Math.random(),
              }))}
            >
              <Shuffle />
              {t("Sort Randomly")}
            </CommandItem>
            {listingCtx.currentSort != null && (
              <CommandItem
                value="Clear Sort"
                onSelect={pick(() => listingCtx.clearSort())}
              >
                <X />
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
            <ListChecks />
            {listingCtx.selectionMode ? disableSelectMode : enableSelectMode}
          </CommandItem>
        )}
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}
