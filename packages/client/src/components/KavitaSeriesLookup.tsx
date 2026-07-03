import type { KavitaSeriesResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useConnectors } from "../hooks/useConnectors";
import { kavitaApi } from "../lib/api/kavita";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/** One-line summary of a search hit: name — library (year). */
function seriesSummary(series: KavitaSeriesResult): string {
  const parts = [series.libraryName, series.releaseYear ? String(series.releaseYear) : null]
    .filter(Boolean)
    .join(", ");
  return parts ? `${series.name} — ${parts}` : series.name;
}

interface KavitaSeriesLookupProps {
  /** Called with a chosen series so the caller can prefill its fields. */
  onSelect: (series: KavitaSeriesResult) => void;
}

/**
 * A debounced search box that resolves a query to series on the connected Kavita server (proxied
 * through the middleware so the API key stays server-side). Selecting a result hands it to `onSelect`
 * to prefill a book's name / series ids / release year. Renders nothing when the Kavita connector is
 * unconfigured — modeled on `BookmarkKavitaField`'s search, reused by the Book create + edit forms.
 */
export function KavitaSeriesLookup({
  onSelect,
}: KavitaSeriesLookupProps) {
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
    queryKey: ["kavita-series-search", trimmedQuery],
    queryFn: () => kavitaApi.searchSeries(trimmedQuery),
    enabled: Boolean(connectors?.kavita.enabled) && trimmedQuery.length >= MIN_QUERY_LENGTH,
  });

  if (!connectors?.kavita.enabled) return null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="kavita-series-lookup">Look up on Kavita</Label>
      <div className="relative">
        <Input
          id="kavita-series-lookup"
          placeholder="Search your Kavita library…"
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
        ? <p className="text-xs text-muted-foreground">No matching series found.</p>
        : null}
      {search.isSuccess && search.data.length > 0
        ? (
          <ul className="space-y-1 rounded-md border p-1">
            {search.data.map(series => (
              <li key={series.seriesId}>
                <button
                  type="button"
                  className="
                    w-full rounded-sm px-2 py-1 text-left text-sm
                    hover:bg-accent hover:text-accent-foreground
                  "
                  onClick={() => {
                    onSelect(series);
                    setQuery("");
                  }}
                >
                  {seriesSummary(series)}
                </button>
              </li>
            ))}
          </ul>
        )
        : null}
      <p className="text-xs text-muted-foreground">
        Search your Kavita server to fill in the book details automatically.
      </p>
    </div>
  );
}
