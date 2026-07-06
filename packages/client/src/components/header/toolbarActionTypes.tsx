import type { PinContext } from "@/components/HeaderPinButton";
import type { SettingsPage } from "@/lib/settingsPages";
import type { SyncProvider } from "@/lib/syncSources/syncSourceTypes";
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
  listingPage: { key: string;
    hasFilters: boolean;
    hasSort?: boolean;
    createAction?: (event?: React.MouseEvent) => void;
    /** When set, the header Plus offers "Add bookmark" (with an optional locked category). */
    addBookmark?: { categoryId?: string };
    /** Label for the entity-create option in the Plus dropdown (e.g. "New category"). */
    createLabel?: string; } | null;
  /** The selection pageKey of a mounted bulk-selectable listing, or null. Independent of `listingPage`. */
  bulkSelectPageKey: string | null;
  isBookmarkDetail: boolean;
  bookmarkId: string;
  addChild: { kind: "tag" | "mediaType";
    parentId: string | undefined; } | null;
  settingsPage: SettingsPage | null | undefined;
  pinContext: PinContext | null;
  openPanel: () => void;
  /** The mounted edit form's outside-source sync provider, or null. Gates the "Sync from source" button. */
  syncProvider: SyncProvider | null;
}

/**
 * A typed `<Link>` to a taxonomy entity's General **edit** tab, shown on every one of that entity's
 * non-edit pages — the bare listing (`/categories/<slug>`), the `gallery`/`media` listing tabs, and the
 * `info` page — but never on the listing-of-all index (`/categories`) nor on any `…/edit/…` page.
 * Returns `null` elsewhere. Replaced the old header "Info" (view-details) button, now a listing tab.
 * `children` backs both the desktop icon button and the mobile menu row.
 */
export function taxonomyEditLink(pathParts: string[], children: React.ReactNode): React.ReactNode {
  // Show only outside the edit surface — never while already editing.
  if (pathParts.includes("edit")) return null;

  // Top-level taxonomies. `length >= 2` includes the bare listing `/<entity>/<slug>`; the listing-of-all
  // (`length === 1`, e.g. `/categories`) is excluded.
  if (pathParts[0] === "categories" && pathParts.length >= 2) {
    return (
      <Link
        to="/categories/$categorySlug/edit/general"
        params={{
          categorySlug: pathParts[1],
        }}
      >
        {children}
      </Link>
    );
  }
  if (pathParts[0] === "tags" && pathParts.length >= 2) {
    return (
      <Link
        to="/tags/$tagSlug/edit/general"
        params={{
          tagSlug: pathParts[1],
        }}
      >
        {children}
      </Link>
    );
  }

  // `/taxonomies/<entity>/<slug>[/<tab>]`. `length >= 3` includes the bare listing at
  // `/taxonomies/<entity>/<slug>`; the listing-of-all (`length === 2`) is excluded.
  if (pathParts[0] === "taxonomies" && pathParts.length >= 3) {
    const slug = pathParts[2];
    switch (pathParts[1]) {
      case "websites":
        return (
          <Link
            to="/taxonomies/websites/$websiteSlug/edit/general"
            params={{
              websiteSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "media-types":
        return (
          <Link
            to="/taxonomies/media-types/$mediaTypeSlug/edit/general"
            params={{
              mediaTypeSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "youtube-channels":
        return (
          <Link
            to="/taxonomies/youtube-channels/$channelSlug/edit/general"
            params={{
              channelSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "people":
        return (
          <Link
            to="/taxonomies/people/$personSlug/edit/general"
            params={{
              personSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "groups":
        return (
          <Link
            to="/taxonomies/groups/$groupSlug/edit/general"
            params={{
              groupSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "group-types":
        return (
          <Link
            to="/taxonomies/group-types/$groupTypeSlug/edit/general"
            params={{
              groupTypeSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "newsletters":
        return (
          <Link
            to="/taxonomies/newsletters/$newsletterSlug/edit/general"
            params={{
              newsletterSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "property-groups":
        return (
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug/edit/general"
            params={{
              propertyGroupSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "relationship-types":
        return (
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug/edit/general"
            params={{
              relationshipTypeSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "place-types":
        return (
          <Link
            to="/taxonomies/place-types/$placeTypeSlug/edit/general"
            params={{
              placeTypeSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "media-properties":
        return (
          <Link
            to="/taxonomies/media-properties/$mediaPropertySlug/edit/general"
            params={{
              mediaPropertySlug: slug,
            }}
          >{children}
          </Link>
        );
      case "books":
        return (
          <Link
            to="/taxonomies/books/$bookSlug/edit/general"
            params={{
              bookSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "genres-moods":
        return (
          <Link
            to="/taxonomies/genres-moods/$genreMoodSlug/edit/general"
            params={{
              genreMoodSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "languages":
        return (
          <Link
            to="/taxonomies/languages/$languageSlug/edit/general"
            params={{
              languageSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "locations":
        return (
          <Link
            to="/taxonomies/locations/$locationSlug/edit/general"
            params={{
              locationSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "movies":
        return (
          <Link
            to="/taxonomies/movies/$movieSlug/edit/general"
            params={{
              movieSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "tv-shows":
        return (
          <Link
            to="/taxonomies/tv-shows/$tvShowSlug/edit/general"
            params={{
              tvShowSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "episodes":
        return (
          <Link
            to="/taxonomies/episodes/$episodeSlug/edit/general"
            params={{
              episodeSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "albums":
        return (
          <Link
            to="/taxonomies/albums/$albumSlug/edit/general"
            params={{
              albumSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "tracks":
        return (
          <Link
            to="/taxonomies/tracks/$trackSlug/edit/general"
            params={{
              trackSlug: slug,
            }}
          >{children}
          </Link>
        );
      case "podcasts":
        return (
          <Link
            to="/taxonomies/podcasts/$podcastSlug/edit/general"
            params={{
              podcastSlug: slug,
            }}
          >{children}
          </Link>
        );
      default:
        return null;
    }
  }
  return null;
}
