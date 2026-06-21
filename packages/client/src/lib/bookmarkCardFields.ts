import type { CardFieldZones } from "@eesimple/types";

import { useCardDisplayRules } from "../hooks/useCardDisplayRules";
import { useUiStore } from "../stores/uiStore";

// Re-exported from the pure defs module so existing importers keep working; the hook-backed helpers
// below live here because they depend on stores/queries.
export { eligibleCustomCardFields, STANDARD_CARD_FIELDS } from "./bookmarkCardFieldDefs";

/**
 * The set of card field keys hidden for a listing page. Empty when `pageKey` is absent (e.g. the
 * homepage or right-panel cards, which never hide fields).
 */
export function useHiddenCardFields(pageKey?: string): Set<string> {
  const hidden = useUiStore(state => (pageKey ? state.hiddenCardFields[pageKey] : undefined));
  return new Set(hidden ?? []);
}

/**
 * The **Default** card display rule's field zones (`Settings → Card Display Rules`), or `undefined`
 * before the rules load. Non-listing surfaces (homepage, right panel, table view) source corner
 * placement from this, since they don't resolve a per-card rule. Listing cards resolve `fieldZones`
 * per-card via `useResolveCardDisplay` instead.
 */
export function useDefaultFieldZones(): CardFieldZones | undefined {
  const {
    data: rules,
  } = useCardDisplayRules();
  return rules?.find(rule => rule.isDefault)?.fieldZones ?? undefined;
}

/**
 * Whether the website pill should be hidden on a bookmark that also has a YouTube channel — the
 * baseline value from the **Default** card display rule (`Settings → Card Display Rules`). Listing
 * cards resolve this per-card (a specific rule can override it) and pass it explicitly; other surfaces
 * (homepage, right panel, table view) use this Default-rule value.
 */
export function useHideWebsiteForYouTube(): boolean {
  const {
    data: rules,
  } = useCardDisplayRules();
  return rules?.find(rule => rule.isDefault)?.hideWebsiteForYouTube ?? false;
}
