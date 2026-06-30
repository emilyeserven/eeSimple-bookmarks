import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { Link } from "@tanstack/react-router";
import { Columns2, Info, Pencil } from "lucide-react";

import { taxonomyViewLink } from "./toolbarActionTypes";

import { BookmarkDetailLayoutControls } from "@/components/BookmarkDetailLayoutControls";
import { BookmarkDetailLayoutPopover } from "@/components/BookmarkDetailLayoutPopover";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

export function bookmarkLayoutAction(ctx: ToolbarContext): ToolbarAction | null {
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
