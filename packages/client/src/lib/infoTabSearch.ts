/**
 * The `?tab=<key>` search param that selects the active tab on a slug-routed entity's **Info** page
 * (`…/$slug/info`). Every entity's `info` route validates its search with {@link validateInfoTabSearch};
 * the vertical rail in `EntityInfoView` writes it and falls back to the first tab when absent/invalid.
 */
export interface InfoTabSearch {
  tab?: string;
}

export function validateInfoTabSearch(search: Record<string, unknown>): InfoTabSearch {
  return {
    tab: typeof search.tab === "string" ? search.tab : undefined,
  };
}

/**
 * The **Edit** page (`…/$slug/edit`) uses the same `?tab=<key>` shape as Info — `EntityEditView`
 * writes it and falls back to the first edit tab. Aliased for call-site clarity (and so the two
 * surfaces can diverge later without touching every route).
 */
export type EditTabSearch = InfoTabSearch;
export const validateEditTabSearch = validateInfoTabSearch;
