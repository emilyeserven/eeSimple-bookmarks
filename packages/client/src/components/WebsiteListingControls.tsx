import type { WebsiteBookmarkFilter, WebsiteBuiltInFilter, WebsiteIsbnFilter, WebsiteSortMode } from "@/lib/websiteListingSort";

import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { ResponsivePopover } from "./ui/responsive-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { iconComboboxOptions, mediaTypeNodesToOptions } from "@/lib/comboboxOptions";
import { sortFavoritesFirst } from "@/lib/favoritesOrder";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

/**
 * The Websites listing's Sort dropdown + Filter popover, rendered in the `ListingSearchBox` sort slot
 * (config `renderSearchSort`). Sort writes `uiStore.websiteSortMode` (consumed by `useWebsiteSortedItems`);
 * the popover writes the four facet prefs (consumed by `useWebsiteFacetFilter`). Category/Media Type are
 * relational comboboxes (like the YouTube Channels category filter); Built-in and Has-bookmarks are selects.
 * The Prune-empty + Multiselect controls render separately, in `WebsiteListingDisplayExtras`.
 */
export function WebsiteListingControls() {
  const {
    t,
  } = useTranslation();

  const sortMode = useUiStore(s => s.websiteSortMode);
  const setSortMode = useUiStore(s => s.setWebsiteSortMode);
  const category = useUiStore(s => s.websiteCategoryFilter);
  const setCategory = useUiStore(s => s.setWebsiteCategoryFilter);
  const mediaType = useUiStore(s => s.websiteMediaTypeFilter);
  const setMediaType = useUiStore(s => s.setWebsiteMediaTypeFilter);
  const builtIn = useUiStore(s => s.websiteBuiltInFilter);
  const setBuiltIn = useUiStore(s => s.setWebsiteBuiltInFilter);
  const bookmark = useUiStore(s => s.websiteBookmarkFilter);
  const setBookmark = useUiStore(s => s.setWebsiteBookmarkFilter);
  const isbn = useUiStore(s => s.websiteIsbnFilter);
  const setIsbn = useUiStore(s => s.setWebsiteIsbnFilter);

  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();

  const sortOptions: { value: WebsiteSortMode;
    label: string; }[] = [
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
    {
      value: "created-desc",
      label: t("Newest"),
    },
    {
      value: "created-asc",
      label: t("Oldest"),
    },
  ];

  const filterActive
    = category != null || mediaType != null || builtIn !== "all" || bookmark !== "all" || isbn !== "all";

  return (
    <div className="flex items-center gap-2">
      <div className="w-44">
        <Combobox
          options={sortOptions}
          value={sortMode}
          onValueChange={(value) => {
            if (value) setSortMode(value as WebsiteSortMode);
          }}
          aria-label={t("Sort websites")}
        />
      </div>

      <ResponsivePopover
        title={t("Filter websites")}
        trigger={(
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={t("Filter websites")}
          >
            <SlidersHorizontal
              className={cn("size-4", filterActive && "text-primary")}
            />
            {t("Filter")}
            {filterActive && <span className="size-1.5 rounded-full bg-primary" />}
          </Button>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("Category")}</Label>
            <Combobox
              options={iconComboboxOptions(sortFavoritesFirst(categories ?? []))}
              value={category ?? undefined}
              onValueChange={value => setCategory(value ?? null)}
              placeholder={t("All categories")}
              searchPlaceholder={t("Search categories…")}
              aria-label={t("Filter websites by category")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("Default Media Type")}</Label>
            <Combobox
              options={mediaTypeNodesToOptions(mediaTypeTree ?? [])}
              value={mediaType ?? undefined}
              onValueChange={value => setMediaType(value ?? null)}
              placeholder={t("All media types")}
              searchPlaceholder={t("Search media types…")}
              aria-label={t("Filter websites by media type")}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">{t("Type")}</Label>
            <Select
              value={builtIn}
              onValueChange={value => setBuiltIn(value as WebsiteBuiltInFilter)}
            >
              <SelectTrigger
                size="sm"
                className="w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All")}</SelectItem>
                <SelectItem value="builtin">{t("Built-in")}</SelectItem>
                <SelectItem value="custom">{t("Custom")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">{t("Bookmarks")}</Label>
            <Select
              value={bookmark}
              onValueChange={value => setBookmark(value as WebsiteBookmarkFilter)}
            >
              <SelectTrigger
                size="sm"
                className="w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All")}</SelectItem>
                <SelectItem value="has">{t("Has bookmarks")}</SelectItem>
                <SelectItem value="empty">{t("Empty")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">{t("ISBN scanning")}</Label>
            <Select
              value={isbn}
              onValueChange={value => setIsbn(value as WebsiteIsbnFilter)}
            >
              <SelectTrigger
                size="sm"
                className="w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All")}</SelectItem>
                <SelectItem value="can">{t("Can extract ISBNs")}</SelectItem>
                <SelectItem value="cannot">{t("Cannot extract ISBNs")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ResponsivePopover>
    </div>
  );
}
