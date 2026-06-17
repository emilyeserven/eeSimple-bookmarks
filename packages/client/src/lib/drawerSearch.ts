/**
 * URL-persisted state for the shared right-hand panel. `dCT` (drawer content type) selects which
 * editor the panel shows; `dCId` (drawer content id) is the target tag/rule id, or the `new`
 * sentinel to create one. The pair lives on the root route as global search params (retained
 * across navigation), so the panel survives page changes and is deep-linkable.
 */
export type DrawerContentType = "autofill" | "tag";

/** Sentinel `dCId` value that opens an editor in "create" mode instead of editing an existing id. */
export const NEW_SENTINEL = "new";

export interface DrawerSearch {
  dCT?: DrawerContentType;
  dCId?: string;
}

/**
 * Narrow an unknown search record into a `DrawerSearch`. The two params are only meaningful as a
 * pair, so an incomplete or malformed pair collapses to `{}` — keeping "panel open" equivalent to
 * "both present" and leaving the URL clean.
 */
export function validateDrawerSearch(search: Record<string, unknown>): DrawerSearch {
  const dCT = search.dCT === "autofill" || search.dCT === "tag" ? search.dCT : undefined;
  const dCId = typeof search.dCId === "string" && search.dCId.length > 0 ? search.dCId : undefined;

  if (!dCT || !dCId) return {};
  return {
    dCT,
    dCId,
  };
}
