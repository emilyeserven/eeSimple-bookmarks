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
 * Per-entity renderers for a `/taxonomies/<entity>/<slug>` read-only view `<Link>`. Each entry is its
 * own closure so TanStack Router keeps type-checking the literal `to`/`params` per route. Adding a
 * taxonomy = one entry here.
 */
const TAXONOMY_VIEW_LINK_RENDERERS: Record<
  string,
  (slug: string, children: React.ReactNode) => React.ReactNode
> = {
  "websites": (slug, children) => (
    <Link
      to="/taxonomies/websites/$websiteSlug/general"
      params={{
        websiteSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "media-types": (slug, children) => (
    <Link
      to="/taxonomies/media-types/$mediaTypeSlug/general"
      params={{
        mediaTypeSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "youtube-channels": (slug, children) => (
    <Link
      to="/taxonomies/youtube-channels/$channelSlug/general"
      params={{
        channelSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "locations": (slug, children) => (
    <Link
      to="/taxonomies/locations/$locationSlug/general"
      params={{
        locationSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "media-properties": (slug, children) => (
    <Link
      to="/taxonomies/media-properties/$mediaPropertySlug/general"
      params={{
        mediaPropertySlug: slug,
      }}
    >{children}
    </Link>
  ),
  "movies": (slug, children) => (
    <Link
      to="/taxonomies/movies/$movieSlug/general"
      params={{
        movieSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "tv-shows": (slug, children) => (
    <Link
      to="/taxonomies/tv-shows/$tvShowSlug/general"
      params={{
        tvShowSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "episodes": (slug, children) => (
    <Link
      to="/taxonomies/episodes/$episodeSlug/general"
      params={{
        episodeSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "albums": (slug, children) => (
    <Link
      to="/taxonomies/albums/$albumSlug/general"
      params={{
        albumSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "tracks": (slug, children) => (
    <Link
      to="/taxonomies/tracks/$trackSlug/general"
      params={{
        trackSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "books": (slug, children) => (
    <Link
      to="/taxonomies/books/$bookSlug/general"
      params={{
        bookSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "podcasts": (slug, children) => (
    <Link
      to="/taxonomies/podcasts/$podcastSlug/general"
      params={{
        podcastSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "languages": (slug, children) => (
    <Link
      to="/taxonomies/languages/$languageSlug/general"
      params={{
        languageSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "people": (slug, children) => (
    <Link
      to="/taxonomies/people/$personSlug/general"
      params={{
        personSlug: slug,
      }}
    >{children}
    </Link>
  ),
  "groups": (slug, children) => (
    <Link
      to="/taxonomies/groups/$groupSlug/general"
      params={{
        groupSlug: slug,
      }}
    >{children}
    </Link>
  ),
};

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
      >{children}
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
      >{children}
      </Link>
    );
  }
  if (pathParts[0] === "taxonomies" && pathParts.length === 3) {
    return TAXONOMY_VIEW_LINK_RENDERERS[pathParts[1]]?.(pathParts[2], children) ?? null;
  }
  return null;
}

/**
 * A typed `<Link>` to a taxonomy entity's General **edit** tab, but only when the current path is one
 * of that entity's read-only view/detail tabs (`…/<slug>/<tab>`) — never on the bare entity-scoped
 * bookmarks index (`/categories/<slug>`) nor on any `…/edit/…` page. Returns `null` elsewhere.
 * `children` backs both the desktop icon button and the mobile menu row. Mirrors {@link taxonomyViewLink}.
 */
export function taxonomyEditLink(pathParts: string[], children: React.ReactNode): React.ReactNode {
  // Show only on a view/detail tab — never while already editing.
  if (pathParts.includes("edit")) return null;

  // Top-level taxonomies. `length >= 3` excludes the bare bookmarks index at `/<entity>/<slug>`.
  if (pathParts[0] === "categories" && pathParts.length >= 3) {
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
  if (pathParts[0] === "tags" && pathParts.length >= 3) {
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

  // `/taxonomies/<entity>/<slug>/<tab>`. `length >= 4` excludes the bare `/taxonomies/<entity>/<slug>`.
  if (pathParts[0] === "taxonomies" && pathParts.length >= 4) {
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
