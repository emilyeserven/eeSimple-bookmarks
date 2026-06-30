import type { PinContext } from "@/components/HeaderPinButton";
import type { SettingsPage } from "@/lib/settingsPages";
import type { LucideIcon } from "lucide-react";

import React from "react";

import { Link } from "@tanstack/react-router";

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
    hasSort?: boolean;
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
export function taxonomyViewLink(pathParts: string[], children: React.ReactNode): React.ReactNode {
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
    if (pathParts[1] === "locations") {
      return (
        <Link
          to="/taxonomies/locations/$locationSlug/general"
          params={{
            locationSlug: slug,
          }}
        >
          {children}
        </Link>
      );
    }
  }
  return null;
}
