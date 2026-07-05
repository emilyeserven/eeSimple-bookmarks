import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { ArrowUpDown, Eye, Filter } from "lucide-react";

import { BookmarkSortPopover } from "@/components/BookmarkSortPopover";
import { DisplayOptionsPopover } from "@/components/DisplayOptionsPopover";
import { FilterLocationControls } from "@/components/FilterLocationControls";
import { FilterLocationPopover } from "@/components/FilterLocationPopover";
import { BulkSelectMenuItem, HeaderBulkSelectButton } from "@/components/header/HeaderBulkSelectButton";
import { ListingDisplayControls } from "@/components/ListingDisplayControls";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import i18n from "@/i18n";

export function filterLocationAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.listingPage?.hasFilters) return null;
  return {
    key: "filter-location",
    desktop: <FilterLocationPopover />,
    mobile: {
      kind: "modal",
      icon: Filter,
      label: i18n.t("Filters"),
      renderModal: (open, onOpenChange) => (
        <ResponsivePopover
          title={i18n.t("Filters")}
          open={open}
          onOpenChange={onOpenChange}
        >
          <FilterLocationControls />
        </ResponsivePopover>
      ),
    },
  };
}

export function displayOptionsAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.listingPage) return null;
  const pageKey = ctx.listingPage.key;
  return {
    key: "display-options",
    desktop: <DisplayOptionsPopover pageKey={pageKey} />,
    mobile: {
      kind: "modal",
      icon: Eye,
      label: i18n.t("Display"),
      renderModal: (open, onOpenChange) => (
        <ResponsivePopover
          title={i18n.t("Display")}
          open={open}
          onOpenChange={onOpenChange}
        >
          <ListingDisplayControls pageKey={pageKey} />
        </ResponsivePopover>
      ),
    },
  };
}

export function bulkSelectAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.bulkSelectPageKey) return null;
  const pageKey = ctx.bulkSelectPageKey;
  return {
    key: "bulk-select",
    desktop: <HeaderBulkSelectButton pageKey={pageKey} />,
    mobile: {
      kind: "menuItem",
      node: <BulkSelectMenuItem pageKey={pageKey} />,
    },
  };
}

export function sortAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.listingPage?.hasSort) return null;
  return {
    key: "sort",
    desktop: <BookmarkSortPopover />,
    mobile: {
      kind: "modal",
      icon: ArrowUpDown,
      label: i18n.t("Sort"),
      renderModal: (open, onOpenChange) => (
        <BookmarkSortPopover
          open={open}
          onOpenChange={onOpenChange}
        />
      ),
    },
  };
}
