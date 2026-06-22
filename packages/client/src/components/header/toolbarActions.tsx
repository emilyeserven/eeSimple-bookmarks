import type { PinContext } from "@/components/HeaderPinButton";
import type { SettingsPage } from "@/lib/settingsPages";
import type { LucideIcon } from "lucide-react";

import React from "react";

import { Link } from "@tanstack/react-router";
import { Columns2, Eye, Filter, Info, PanelRight, Pencil, Plus, Search } from "lucide-react";

import { AddChildButton } from "@/components/AddChildButton";
import { AddChildModal } from "@/components/AddChildModal";
import { BookmarkDetailLayoutControls } from "@/components/BookmarkDetailLayoutControls";
import { BookmarkDetailLayoutPopover } from "@/components/BookmarkDetailLayoutPopover";
import { DisplayOptionsPopover } from "@/components/DisplayOptionsPopover";
import { FilterLocationControls } from "@/components/FilterLocationControls";
import { FilterLocationPopover } from "@/components/FilterLocationPopover";
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
    createAction?: () => void; } | null;
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

/**
 * The canonical, ordered header toolbar actions (left → right). The array order is the single source
 * of button order, applied identically to the desktop row and the small-screen More menu. Only
 * present ones render; the panel toggle is always last (the rightmost control).
 */
export function buildToolbarActions(ctx: ToolbarContext): ToolbarAction[] {
  const actions: ToolbarAction[] = [];

  if (ctx.headerSearchActive) {
    actions.push({
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
    });
  }

  if (ctx.listingPage?.hasFilters) {
    actions.push({
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
    });
  }

  if (ctx.listingPage) {
    const pageKey = ctx.listingPage.key;
    actions.push({
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
    });
  }

  if (ctx.isBookmarkDetail) {
    actions.push({
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
    });
  }

  const viewDesktopLink = taxonomyViewLink(
    ctx.pathParts,
    <Info
      className="size-4"
    />,
  );
  if (viewDesktopLink) {
    actions.push({
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
    });
  }

  if (ctx.isBookmarkDetail) {
    const bookmarkId = ctx.bookmarkId;
    actions.push({
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
    });
  }

  if (ctx.addChild) {
    const addChild = ctx.addChild;
    const label = addChild.kind === "tag" ? "New sub-tag" : "New sub-type";
    actions.push({
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
    });
  }

  if (ctx.listingPage?.createAction) {
    const createAction = ctx.listingPage.createAction;
    actions.push({
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
    });
  }

  if (ctx.settingsPage) {
    const settingsPage = ctx.settingsPage;
    actions.push({
      key: "settings-favorite",
      desktop: <HeaderSettingsFavoriteButton page={settingsPage} />,
      mobile: {
        kind: "menuItem",
        node: <FavoriteMenuItem page={settingsPage} />,
      },
    });
  }

  if (ctx.pinContext) {
    const pinContext = ctx.pinContext;
    actions.push({
      key: "pin",
      desktop: <HeaderPinButton context={pinContext} />,
      mobile: {
        kind: "menuItem",
        node: <PinMenuItem context={pinContext} />,
      },
    });
  }

  actions.push({
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
  });

  return actions;
}
