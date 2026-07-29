import type { PinContext } from "@/components/HeaderPinButton";
import type { FavoriteContext } from "@/hooks/useFavoriteToggle";
import type { SettingsPage } from "@/lib/settingsPages";
import type { SyncProvider } from "@/lib/syncSources/syncSourceTypes";
import type { LucideIcon } from "lucide-react";

import React from "react";

import { Link } from "@tanstack/react-router";

import { ENTITY_ROUTES, matchEntityRoute } from "@/lib/entityRoutes";

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
      renderModal: (open: boolean, onOpenChange: (open: boolean) => void) => React.ReactNode; };

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
    hasSort?: boolean;
    createAction?: (event?: React.MouseEvent) => void;
    /** When set, the header Plus offers "Add bookmark" (with an optional locked category). */
    addBookmark?: { categoryId?: string };
    /** Label for the entity-create option in the Plus dropdown (e.g. "New category"). */
    createLabel?: string; } | null;
  isBookmarkDetail: boolean;
  bookmarkId: string;
  addChild: { kind: "tag" | "mediaType";
    parentId: string | undefined; }
    | { kind: "taxonomyTerm";
      parentId: string | undefined;
      taxonomyId: string | undefined;
      taxonomySlug: string; }
      | null;
  settingsPage: SettingsPage | null | undefined;
  pinContext: PinContext | null;
  /** The favoritable (starrable) category/tag for the current page, or null. Gates the star button. */
  favoriteContext: FavoriteContext | null;
  /** The mounted edit form's outside-source sync provider, or null. Gates the "Sync from source" button. */
  syncProvider: SyncProvider | null;
}

/**
 * A `<Link>` to a slug-routed entity's **edit** page, shown on every one of that entity's non-edit
 * pages — the bare listing (`/categories/<slug>`), the `gallery`/`media` listing tabs, and the `info`
 * page — but never on the listing-of-all index (`/categories`) nor on any `…/edit/…` page. Returns
 * `null` elsewhere. Replaced the old header "Info" (view-details) button, now a listing tab.
 *
 * Derived from `ENTITY_ROUTES` via `matchEntityRoute` — the same data the CMD+K registry and
 * breadcrumbs derive from — so every slug-routed kind (all 19) gets the Edit pencil with no
 * per-entity branch; the edit path follows the `${prefix}/${slug}/edit` convention (the
 * `useEntityCommandContext` `editPath`). Custom-taxonomy term pages
 * (`/taxonomies/$taxonomyKey/$termSlug`) are not an `EntityRouteKind`, so they are linked as an
 * explicit special case. `children` backs both the desktop icon button and the mobile menu row.
 */
export function taxonomyEditLink(pathParts: string[], children: React.ReactNode): React.ReactNode {
  // Show only outside the edit surface — never while already editing.
  if (pathParts.includes("edit")) return null;

  const pathname = `/${pathParts.join("/")}`;
  // Listing-of-all indexes (no slug) and create pages (`new`/`backfill`) match no route.
  const matched = matchEntityRoute(pathname);
  if (matched) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link to={`${matched.route.prefix}/${matched.slug}/edit` as any}>
        {children}
      </Link>
    );
  }

  // A `/taxonomies/<key>/<slug>` page whose `<key>` is no built-in entity route is a user-created
  // taxonomy's term page — link the shared term edit route. A built-in `<key>` that reached here has
  // no real slug (e.g. `/taxonomies/locations/new`), so it gets no Edit link either.
  const isBuiltInTaxonomySegment = ENTITY_ROUTES.some(
    route => route.prefix === `/taxonomies/${pathParts[1]}`,
  );
  if (pathParts[0] === "taxonomies" && pathParts.length >= 3 && !isBuiltInTaxonomySegment) {
    return (
      <Link
        to="/taxonomies/$taxonomyKey/$termSlug/edit"
        params={{
          taxonomyKey: pathParts[1],
          termSlug: pathParts[2],
        }}
      >
        {children}
      </Link>
    );
  }
  return null;
}
