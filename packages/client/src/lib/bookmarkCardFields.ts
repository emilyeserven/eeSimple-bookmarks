import type { CardFieldZones } from "@eesimple/types";

import { fieldZonesFromConfig } from "@eesimple/types";

import { useCardDisplayConfig } from "../hooks/useCardDisplayConfig";

// Re-exported from the pure defs module so existing importers keep working; the hook-backed helpers
// below live here because they depend on stores/queries.
export { STANDARD_CARD_FIELDS } from "./bookmarkCardFieldDefs";

/**
 * The single card-display config flattened into the legacy {@link CardFieldZones} shape, or
 * `undefined` before the config loads. Non-listing surfaces (homepage default, right panel, table
 * view) source per-field knobs / corner placement from this, since they don't resolve per-card
 * sections. Listing cards resolve their sections per-card via `useResolveCardDisplay` instead.
 */
export function useDefaultFieldZones(): CardFieldZones | undefined {
  const {
    data: config,
  } = useCardDisplayConfig();
  return config ? fieldZonesFromConfig(config) : undefined;
}

/**
 * Whether the website pill should be hidden on a bookmark that also has a YouTube channel — the value
 * from the single card-display config. Listing cards resolve this per-card and pass it explicitly;
 * other surfaces (homepage, right panel, table view) use this config value.
 */
export function useHideWebsiteForYouTube(): boolean {
  const {
    data: config,
  } = useCardDisplayConfig();
  return config?.hideWebsiteForYouTube ?? false;
}
