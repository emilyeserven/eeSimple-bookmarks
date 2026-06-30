import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { Eye, Filter, Search } from "lucide-react";

import { DisplayOptionsPopover } from "@/components/DisplayOptionsPopover";
import { FilterLocationControls } from "@/components/FilterLocationControls";
import { FilterLocationPopover } from "@/components/FilterLocationPopover";
import { BulkSelectMenuItem, HeaderBulkSelectButton } from "@/components/header/HeaderBulkSelectButton";
import { SearchControls } from "@/components/header/headerMenuItems";
import { ListingDisplayControls } from "@/components/ListingDisplayControls";
import { ListingSearchBar } from "@/components/ListingSearchBar";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

export function searchAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.headerSearchActive) return null;
  return {
    key: "search-bar",
    desktop: <ListingSearchBar />,
    mobile: {
      kind: "modal",
      icon: Search,
      label: "Search",
      renderModal: (open, onOpenChange) => (
        <ResponsivePopover
          title="Search"
          open={open}
          onOpenChange={onOpenChange}
        >
          <SearchControls />
        </ResponsivePopover>
      ),
    },
  };
}

export function filterLocationAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.listingPage?.hasFilters) return null;
  return {
    key: "filter-location",
    desktop: <FilterLocationPopover />,
    mobile: {
      kind: "modal",
      icon: Filter,
      label: "Filters",
      renderModal: (open, onOpenChange) => (
        <ResponsivePopover
          title="Filters"
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
      label: "Display",
      renderModal: (open, onOpenChange) => (
        <ResponsivePopover
          title="Display"
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
