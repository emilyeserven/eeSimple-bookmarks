import { useEffect } from "react";

import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/stores/uiStore";

/**
 * The in-page quick-search input rendered above a listing's content (bookmarks and every taxonomy
 * listing). Bound to the shared `headerSearchQuery` store value that each listing reads to filter its
 * rows. Clears the query on unmount so the text doesn't leak to the next page.
 */
export function ListingSearchBar() {
  const headerSearchQuery = useUiStore(state => state.headerSearchQuery);
  const setHeaderSearchQuery = useUiStore(state => state.setHeaderSearchQuery);
  const {
    t,
  } = useTranslation();

  // Reset the query when leaving the listing page.
  useEffect(() => () => setHeaderSearchQuery(""), [setHeaderSearchQuery]);

  return (
    <div className="relative max-w-md">
      <Search
        className="
          pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2
          text-muted-foreground
        "
      />
      <Input
        type="text"
        placeholder={t("Search…")}
        aria-label={t("Search")}
        value={headerSearchQuery}
        onChange={e => setHeaderSearchQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") setHeaderSearchQuery(""); }}
        className="px-9"
      />
      {headerSearchQuery
        ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Clear search")}
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
            onClick={() => setHeaderSearchQuery("")}
          >
            <X className="size-4" />
          </Button>
        )
        : null}
    </div>
  );
}
