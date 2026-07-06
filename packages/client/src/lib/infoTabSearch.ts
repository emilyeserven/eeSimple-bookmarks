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
