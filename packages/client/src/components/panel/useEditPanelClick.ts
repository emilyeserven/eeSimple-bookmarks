import type { DrawerContentType, DrawerMode } from "@/lib/drawerSearch";
import type { MouseEvent } from "react";

import { useCallback } from "react";

import { useNavigate } from "@tanstack/react-router";

import { usePanelControls } from "./usePanelControls";
import { useSidebarOpenModifier } from "../../hooks/useAppSettings";

import { hasSidebarModifier } from "@/lib/sidebarModifier";

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
  "location": slug => `/taxonomies/locations/${slug}/edit/general`,
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
 * Two modifier shortcuts (checked in priority order):
 * - **Shift**: navigate to the entity's edit page in the same tab. Pass `slug` to enable.
 * - **Configured sidebar modifier** (default Alt): open the item in the right-hand panel.
 * - **No modifier / Cmd**: the underlying `<Link>` navigates normally (detail page same tab / new tab).
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
