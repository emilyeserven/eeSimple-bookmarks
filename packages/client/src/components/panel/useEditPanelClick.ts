import type { DrawerContentType, DrawerMode } from "@/lib/drawerSearch";
import type { MouseEvent } from "react";

import { useCallback } from "react";

import { useNavigate } from "@tanstack/react-router";

import { usePanelControls } from "./usePanelControls";
import { useSidebarOpenModifier } from "../../hooks/useAppSettings";

import { hasSidebarModifier } from "@/lib/sidebarModifier";

/** Path builders for each entity's detail (view) page, keyed by DrawerContentType. */
const VIEW_PATHS: Partial<Record<DrawerContentType, (slug: string) => string>> = {
  "bookmark": id => `/bookmarks/${id}`,
  "tag": slug => `/tags/${slug}`,
  "category": slug => `/categories/${slug}`,
  "property": slug => `/custom-properties/${slug}`,
  "property-group": slug => `/taxonomies/property-groups/${slug}`,
  "website": slug => `/taxonomies/websites/${slug}`,
  "media-type": slug => `/taxonomies/media-types/${slug}`,
  "youtube-channel": slug => `/taxonomies/youtube-channels/${slug}`,
  "newsletter": slug => `/taxonomies/newsletters/${slug}`,
  "author": slug => `/taxonomies/authors/${slug}`,
  "relationship-type": slug => `/taxonomies/relationship-types/${slug}`,
  "autofill": slug => `/autofill/${slug}`,
  "import-rule": slug => `/import-rules/${slug}`,
};

/** Path builders for each entity's edit page, keyed by DrawerContentType. */
const EDIT_PATHS: Partial<Record<DrawerContentType, (slug: string) => string>> = {
  "bookmark": id => `/bookmarks/${id}/edit/general`,
  "tag": slug => `/tags/${slug}/edit/general`,
  "category": slug => `/categories/${slug}/edit/general`,
  "property": slug => `/custom-properties/${slug}/edit/general`,
  "property-group": slug => `/taxonomies/property-groups/${slug}/edit/general`,
  "website": slug => `/taxonomies/websites/${slug}/edit/general`,
  "media-type": slug => `/taxonomies/media-types/${slug}/edit/general`,
  "youtube-channel": slug => `/taxonomies/youtube-channels/${slug}/edit/general`,
  "newsletter": slug => `/taxonomies/newsletters/${slug}/edit/general`,
  "author": slug => `/taxonomies/authors/${slug}/edit/general`,
  "relationship-type": slug => `/taxonomies/relationship-types/${slug}/edit/general`,
  "autofill": slug => `/autofill/${slug}/edit/general`,
  "import-rule": slug => `/import-rules/${slug}/edit/general`,
};

/**
 * Returns a click handler for a navigation affordance. A normal click falls through to the
 * underlying `<Link>` (navigating to the full page), while holding the user's configured modifier
 * opens the item in the shared right-hand sidebar in `mode` instead. Spread onto the `<Link>` an
 * Edit button or a view row renders.
 */
function useOpenInPanelClick(mode: DrawerMode): (
  event: MouseEvent,
  ct: DrawerContentType,
  id: string,
) => void {
  const {
    openItem,
  } = usePanelControls();
  const modifier = useSidebarOpenModifier();

  return useCallback(
    (event: MouseEvent, ct: DrawerContentType, id: string) => {
      // Without the configured modifier, let the Link navigate to the full page.
      if (!hasSidebarModifier(event, modifier)) return;
      // Suppress navigation and any native modifier behavior (e.g. open-in-new-tab), open the panel.
      event.preventDefault();
      openItem(ct, id, mode);
    },
    [openItem, modifier, mode],
  );
}

/**
 * Click handler for an Edit affordance: holding the configured modifier opens the item in the
 * sidebar in edit mode instead of navigating to its full edit page.
 */
export function useEditPanelClick(): (
  event: MouseEvent,
  ct: DrawerContentType,
  id: string,
) => void {
  return useOpenInPanelClick("edit");
}

/**
 * Click handler for a view/navigation affordance (a listing row, title, or cross-reference link).
 *
 * Three modifier shortcuts (checked in priority order):
 * - **Cmd/Meta**: navigate to the entity's detail page in the same tab (overrides panel if meta
 *   is the configured modifier). Pass `slug` to enable this shortcut.
 * - **Shift**: navigate to the entity's edit page in the same tab. Pass `slug` to enable.
 * - **Configured sidebar modifier** (default Alt): open the item in the right-hand panel.
 * - **No modifier**: the underlying `<Link>` navigates normally to the detail page.
 */
export function useViewPanelClick(): (
  event: MouseEvent,
  ct: DrawerContentType,
  id: string,
  slug?: string,
) => void {
  const {
    openItem,
  } = usePanelControls();
  const modifier = useSidebarOpenModifier();
  const navigate = useNavigate();

  return useCallback(
    (event: MouseEvent, ct: DrawerContentType, id: string, slug?: string) => {
      if (event.metaKey) {
        const path = slug ? VIEW_PATHS[ct]?.(slug) : undefined;
        if (path) {
          event.preventDefault();
          void navigate({
            href: path,
          });
        }
        // If no path is registered, fall through — the browser handles meta+click (new tab).
        return;
      }
      if (event.shiftKey) {
        const path = slug ? EDIT_PATHS[ct]?.(slug) : undefined;
        if (path) {
          event.preventDefault();
          void navigate({
            href: path,
          });
        }
        // Consume the event even without a path to prevent the browser's "open new window" behavior.
        return;
      }
      // Without the configured modifier, let the Link navigate to the full page.
      if (!hasSidebarModifier(event, modifier)) return;
      // Suppress navigation and any native modifier behavior (e.g. open-in-new-tab), open the panel.
      event.preventDefault();
      openItem(ct, id, "view");
    },
    [openItem, modifier, navigate],
  );
}
