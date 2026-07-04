import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { Link } from "@tanstack/react-router";
import { Columns2, Info, Pencil } from "lucide-react";

import { taxonomyEditLink, taxonomyViewLink } from "./toolbarActionTypes";

import { BookmarkDetailLayoutControls } from "@/components/BookmarkDetailLayoutControls";
import { BookmarkDetailLayoutPopover } from "@/components/BookmarkDetailLayoutPopover";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import i18n from "@/i18n";

export function bookmarkLayoutAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.isBookmarkDetail) return null;
  return {
    key: "bookmark-layout",
    desktop: <BookmarkDetailLayoutPopover />,
    mobile: {
      kind: "modal",
      icon: Columns2,
      label: i18n.t("Layout"),
      renderModal: (open, onOpenChange) => (
        <ResponsivePopover
          title={i18n.t("Layout")}
          open={open}
          onOpenChange={onOpenChange}
        >
          <BookmarkDetailLayoutControls />
        </ResponsivePopover>
      ),
    },
  };
}

export function viewDetailsAction(ctx: ToolbarContext): ToolbarAction | null {
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
        aria-label={i18n.t("View details")}
        title={i18n.t("View details")}
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
                {i18n.t("View details")}
              </>
            ),
          )}
        </DropdownMenuItem>
      ),
    },
  };
}

export function editTaxonomyAction(ctx: ToolbarContext): ToolbarAction | null {
  const editDesktopLink = taxonomyEditLink(
    ctx.pathParts,
    <Pencil
      className="size-4"
    />,
  );
  if (!editDesktopLink) return null;
  return {
    key: "edit-taxonomy",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={i18n.t("Edit")}
        title={i18n.t("Edit")}
        asChild
      >
        {editDesktopLink}
      </Button>
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <DropdownMenuItem asChild>
          {taxonomyEditLink(
            ctx.pathParts, (
              <>
                <Pencil className="size-4" />
                {i18n.t("Edit")}
              </>
            ),
          )}
        </DropdownMenuItem>
      ),
    },
  };
}

export function editBookmarkAction(ctx: ToolbarContext): ToolbarAction | null {
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
          {i18n.t("Edit")}
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
            {i18n.t("Edit")}
          </Link>
        </DropdownMenuItem>
      ),
    },
  };
}
