import type { PinContext } from "@/components/HeaderPinButton";
import type { SettingsPage } from "@/lib/settingsPages";
import type { LucideIcon } from "lucide-react";

import React from "react";

import { Link } from "@tanstack/react-router";
import { Columns2, Eye, Filter, Info, PanelRight, Pencil, Plus, Search, Settings } from "lucide-react";

import { AddChildButton } from "@/components/AddChildButton";
import { AddChildModal } from "@/components/AddChildModal";
import { BookmarkDetailLayoutControls } from "@/components/BookmarkDetailLayoutControls";
import { BookmarkDetailLayoutPopover } from "@/components/BookmarkDetailLayoutPopover";
import { DisplayOptionsPopover } from "@/components/DisplayOptionsPopover";
import { FilterLocationControls } from "@/components/FilterLocationControls";
import { FilterLocationPopover } from "@/components/FilterLocationPopover";
import { BulkSelectMenuItem, HeaderBulkSelectButton } from "@/components/header/HeaderBulkSelectButton";
import { FavoriteMenuItem, PinMenuItem, SearchControls } from "@/components/header/headerMenuItems";
import { HeaderPinButton } from "@/components/HeaderPinButton";
import { HeaderSettingsFavoriteButton } from "@/components/HeaderSettingsFavoriteButton";
import { ListingDisplayControls } from "@/components/ListingDisplayControls";
import { ListingSearchBar } from "@/components/ListingSearchBar";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

/** How a toolbar action behaves once collapsed into the small-screen More menu. */
export type ToolbarMobile
  /** A self-contained `DropdownMenuItem` (a link, an action, or a stateful toggle). */
  = | { kind: "menuItem";
    node: React.ReactNode; }
  /** A menu row (icon + label) that opens a modal rendered as a sibling of the dropdown. */
    | { kind: "modal";
      icon: LucideIcon;
      label: string;
      disabled?: boolean;
      renderModal: (open: boolean, onOpenChange: (open: boolean) => void) => React.ReactNode; }
  /** Never collapses — stays a standalone icon outside the More menu (the panel toggle). */
      | { kind: "standalone" };

export interface ToolbarAction {
  key: string;
  /** The wide-screen inline node (the existing button/popover). */
  desktop: React.ReactNode;
  mobile: ToolbarMobile;
}

/** Context the header resolves once and hands to {@link buildToolbarActions}. */
export interface ToolbarContext {
  pathParts: string[];
  headerSearchActive: boolean;
  listingPage: { key: string;
    hasFilters: boolean;
    createAction?: (event?: React.MouseEvent) => void; } | null;
  /** The selection pageKey of a mounted bulk-selectable listing, or null. Independent of `listingPage`. */
  bulkSelectPageKey: string | null;
  isBookmarkDetail: boolean;
  bookmarkId: string;
  addChild: { kind: "tag" | "mediaType";
    parentId: string | undefined; } | null;
  settingsPage: SettingsPage | null | undefined;
  pinContext: PinContext | null;
  openPanel: () => void;
}

/**
 * A typed `<Link>` to a taxonomy item's read-only view page on its listing index page
 * (`/<entity>/<slug>`, not a `_view`/`edit` tab), or `null` elsewhere. `children` lets the same target
 * back both the desktop Info icon and the mobile menu row.
 */
function taxonomyViewLink(pathParts: string[], children: React.ReactNode): React.ReactNode {
  if (pathParts[0] === "categories" && pathParts.length === 2) {
    return (
      <Link
        to="/categories/$categorySlug/general"
        params={{
          categorySlug: pathParts[1],
        }}
      >
        {children}
      </Link>
    );
  }
  if (pathParts[0] === "tags" && pathParts.length === 2) {
    return (
      <Link
        to="/tags/$tagSlug/general"
        params={{
          tagSlug: pathParts[1],
        }}
      >
        {children}
      </Link>
    );
  }
  if (pathParts[0] === "taxonomies" && pathParts.length === 3) {
    const slug = pathParts[2];
    if (pathParts[1] === "websites") {
      return (
        <Link
          to="/taxonomies/websites/$websiteSlug/general"
          params={{
            websiteSlug: slug,
          }}
        >
          {children}
        </Link>
      );
    }
    if (pathParts[1] === "media-types") {
      return (
        <Link
          to="/taxonomies/media-types/$mediaTypeSlug/general"
          params={{
            mediaTypeSlug: slug,
          }}
        >
          {children}
        </Link>
      );
    }
    if (pathParts[1] === "youtube-channels") {
      return (
        <Link
          to="/taxonomies/youtube-channels/$channelSlug/general"
          params={{
            channelSlug: slug,
          }}
        >
          {children}
        </Link>
      );
    }
  }
  return null;
}

function searchAction(ctx: ToolbarContext): ToolbarAction | null {
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

function filterLocationAction(ctx: ToolbarContext): ToolbarAction | null {
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

function displayOptionsAction(ctx: ToolbarContext): ToolbarAction | null {
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

function bulkSelectAction(ctx: ToolbarContext): ToolbarAction | null {
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

function bookmarkLayoutAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.isBookmarkDetail) return null;
  return {
    key: "bookmark-layout",
    desktop: <BookmarkDetailLayoutPopover />,
    mobile: {
      kind: "modal",
      icon: Columns2,
      label: "Layout",
      renderModal: (open, onOpenChange) => (
        <ResponsivePopover
          title="Layout"
          open={open}
          onOpenChange={onOpenChange}
        >
          <BookmarkDetailLayoutControls />
        </ResponsivePopover>
      ),
    },
  };
}

function viewDetailsAction(ctx: ToolbarContext): ToolbarAction | null {
  const viewDesktopLink = taxonomyViewLink(
    ctx.pathParts,
    <Info
      className="size-4"
    />,
  );
  if (!viewDesktopLink) return null;
  return {
    key: "view-details",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="View details"
        title="View details"
        asChild
      >
        {viewDesktopLink}
      </Button>
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <DropdownMenuItem asChild>
          {taxonomyViewLink(
            ctx.pathParts, (
              <>
                <Info className="size-4" />
                View details
              </>
            ),
          )}
        </DropdownMenuItem>
      ),
    },
  };
}

function editBookmarkAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.isBookmarkDetail) return null;
  const bookmarkId = ctx.bookmarkId;
  return {
    key: "edit-bookmark",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        asChild
      >
        <Link
          to="/bookmarks/$bookmarkId/edit/general"
          params={{
            bookmarkId,
          }}
        >
          Edit
        </Link>
      </Button>
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <DropdownMenuItem asChild>
          <Link
            to="/bookmarks/$bookmarkId/edit/general"
            params={{
              bookmarkId,
            }}
          >
            <Pencil className="size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
      ),
    },
  };
}

function addChildAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.addChild) return null;
  const addChild = ctx.addChild;
  const label = addChild.kind === "tag" ? "New sub-tag" : "New sub-type";
  return {
    key: "add-child",
    desktop: (
      <AddChildButton
        kind={addChild.kind}
        parentId={addChild.parentId}
      />
    ),
    mobile: {
      kind: "modal",
      icon: Plus,
      label,
      disabled: !addChild.parentId,
      renderModal: (open, onOpenChange) => (
        <AddChildModal
          kind={addChild.kind}
          parentId={addChild.parentId}
          open={open}
          onOpenChange={onOpenChange}
        />
      ),
    },
  };
}

function createListingAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.listingPage?.createAction) return null;
  const createAction = ctx.listingPage.createAction;
  return {
    key: "create",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="New"
        onClick={createAction}
      >
        <Plus className="size-4" />
      </Button>
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <DropdownMenuItem onSelect={() => createAction()}>
          <Plus className="size-4" />
          New
        </DropdownMenuItem>
      ),
    },
  };
}

function settingsFavoriteAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.settingsPage) return null;
  const settingsPage = ctx.settingsPage;
  return {
    key: "settings-favorite",
    desktop: <HeaderSettingsFavoriteButton page={settingsPage} />,
    mobile: {
      kind: "menuItem",
      node: <FavoriteMenuItem page={settingsPage} />,
    },
  };
}

function pinAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.pinContext) return null;
  const pinContext = ctx.pinContext;
  return {
    key: "pin",
    desktop: <HeaderPinButton context={pinContext} />,
    mobile: {
      kind: "menuItem",
      node: <PinMenuItem context={pinContext} />,
    },
  };
}

/**
 * The homepage's quick link to its settings. Rendered only on the homepage (`/`), sitting just to the
 * left of the panel toggle so it reads as "next to the Right Drawer". Was previously an inline gear
 * link in the homepage body.
 */
function homepageSettingsAction(ctx: ToolbarContext): ToolbarAction | null {
  if (ctx.pathParts.length > 0) return null;
  return {
    key: "homepage-settings",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Homepage settings"
        title="Homepage settings"
        asChild
      >
        <Link to="/settings/display/homepage">
          <Settings className="size-4" />
        </Link>
      </Button>
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <DropdownMenuItem asChild>
          <Link to="/settings/display/homepage">
            <Settings className="size-4" />
            Homepage settings
          </Link>
        </DropdownMenuItem>
      ),
    },
  };
}

function openPanelAction(ctx: ToolbarContext): ToolbarAction {
  return {
    key: "open-panel",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open panel"
        onClick={ctx.openPanel}
      >
        <PanelRight className="size-4" />
      </Button>
    ),
    mobile: {
      kind: "standalone",
    },
  };
}

/**
 * The canonical, ordered header toolbar actions (left → right). The array order is the single source
 * of button order, applied identically to the desktop row and the small-screen More menu. Only
 * present ones render; the panel toggle is always last (the rightmost control).
 */
export function buildToolbarActions(ctx: ToolbarContext): ToolbarAction[] {
  return [
    searchAction(ctx),
    filterLocationAction(ctx),
    displayOptionsAction(ctx),
    bulkSelectAction(ctx),
    bookmarkLayoutAction(ctx),
    viewDetailsAction(ctx),
    editBookmarkAction(ctx),
    addChildAction(ctx),
    createListingAction(ctx),
    settingsFavoriteAction(ctx),
    pinAction(ctx),
    homepageSettingsAction(ctx),
    openPanelAction(ctx),
  ].filter((action): action is ToolbarAction => action !== null);
}
