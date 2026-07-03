import type { PlexItemResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useConnectors } from "../hooks/useConnectors";
import { plexApi } from "../lib/api/plex";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/** One-line summary of a search hit: title — subtitle (year / library). */
function itemSummary(item: PlexItemResult): string {
  return item.subtitle ? `${item.title} — ${item.subtitle}` : item.title;
}

interface PlexItemLookupProps {
  /** Narrows the Plex search to a single media family. */
  kind: "movie" | "show";
  /** Called with a chosen item so the caller can prefill its fields. */
  onSelect: (item: PlexItemResult) => void;
}

/**
 * A debounced search box that resolves a query to items on the connected Plex server (proxied through
 * the middleware so the token stays server-side), narrowed to `kind` (movies or TV shows). Selecting a
 * result hands it to `onSelect` to prefill a Movie / TV Show's name / rating key / year. Renders
 * nothing when the Plex connector is unconfigured — the Plex twin of `KavitaSeriesLookup`.
 */
export function PlexItemLookup({
  kind,
  onSelect,
}: PlexItemLookupProps) {
  const {
    data: connectors,
  } = useConnectors();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const trimmedQuery = debouncedQuery.trim();
  const search = useQuery({
    queryKey: ["plex-item-search", kind, trimmedQuery],
    queryFn: () => plexApi.searchItems(trimmedQuery, kind),
    enabled: Boolean(connectors?.plex.enabled) && trimmedQuery.length >= MIN_QUERY_LENGTH,
  });

  if (!connectors?.plex.enabled) return null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="plex-item-lookup">Look up on Plex</Label>
      <div className="relative">
        <Input
          id="plex-item-lookup"
          placeholder={kind === "movie" ? "Search your Plex movies…" : "Search your Plex shows…"}
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        {search.isFetching
          ? (
            <Loader2
              className="
                absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin
                text-muted-foreground
              "
            />
          )
          : null}
      </div>
      {search.isError
        ? <p className="text-xs text-destructive">{search.error.message}</p>
        : null}
      {search.isSuccess && search.data.length === 0
        ? <p className="text-xs text-muted-foreground">No matching items found.</p>
        : null}
      {search.isSuccess && search.data.length > 0
        ? (
          <ul className="space-y-1 rounded-md border p-1">
            {search.data.map(item => (
              <li key={`${item.type}:${item.ratingKey}`}>
                <button
                  type="button"
                  className="
                    w-full rounded-sm px-2 py-1 text-left text-sm
                    hover:bg-accent hover:text-accent-foreground
                  "
                  onClick={() => {
                    onSelect(item);
                    setQuery("");
                  }}
                >
                  {itemSummary(item)}
                </button>
              </li>
            ))}
          </ul>
        )
        : null}
      <p className="text-xs text-muted-foreground">
        Search your Plex server to fill in the details automatically.
      </p>
    </div>
  );
}
