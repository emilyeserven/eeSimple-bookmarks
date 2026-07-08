import type { LayoutableEntityKind } from "@eesimple/types";

import { LAYOUT_DRIVEN_ENTITIES } from "./layoutDrivenEntities";

/**
 * The `?entity=` search param on Settings → Display → Page Layouts — mirrors the `?tab=` validator in
 * `lib/infoTabSearch.ts`. It carries which layout-driven entity kind is selected so reloading or sharing
 * the URL preserves the selection (instead of always landing on the first kind). Only a kind that the
 * editor actually lists (`LAYOUT_DRIVEN_ENTITIES`) is accepted; anything else resolves to `undefined`
 * (the page then falls back to the first kind).
 */
export interface PageLayoutsSearch {
  entity?: LayoutableEntityKind;
}

export function validatePageLayoutsSearch(search: Record<string, unknown>): PageLayoutsSearch {
  const entity = typeof search.entity === "string"
    && LAYOUT_DRIVEN_ENTITIES.some(candidate => candidate.kind === search.entity)
    ? search.entity as LayoutableEntityKind
    : undefined;
  return {
    entity,
  };
}
