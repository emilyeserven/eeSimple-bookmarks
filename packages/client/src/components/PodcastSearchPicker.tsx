import type { PodcastSearchResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { usePodcastSearch } from "../hooks/usePodcasts";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/** One-line summary of a search hit: name — author. */
function podcastSummary(result: PodcastSearchResult): string {
  return result.author ? `${result.name} — ${result.author}` : result.name;
}

interface PodcastSearchPickerProps {
  /** Called with a chosen podcast so the caller can prefill its fields (name/author/feed/iTunes/artwork). */
  onSelect: (result: PodcastSearchResult) => void;
}

/**
 * A debounced, keyless search box that resolves a query to podcasts via the Apple Podcasts (iTunes)
 * search — proxied through the middleware. Selecting a result hands it to `onSelect` to prefill a
 * podcast's name / author / feed URL / iTunes link. Always shown (no connector to configure); modeled
 * on `KavitaSeriesLookup`, reused by the Podcast create + edit forms.
 */
export function PodcastSearchPicker({
  onSelect,
}: PodcastSearchPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const trimmedQuery = debouncedQuery.trim();
  const search = usePodcastSearch(trimmedQuery.length >= MIN_QUERY_LENGTH ? trimmedQuery : "");

  return (
    <div className="space-y-1.5">
      <Label htmlFor="podcast-search-lookup">Look up on Apple Podcasts</Label>
      <div className="relative">
        <Input
          id="podcast-search-lookup"
          placeholder="Search podcasts…"
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
      {search.isSuccess && search.data.length === 0 && trimmedQuery.length >= MIN_QUERY_LENGTH
        ? <p className="text-xs text-muted-foreground">No matching podcasts found.</p>
        : null}
      {search.isSuccess && search.data.length > 0
        ? (
          <ul className="space-y-1 rounded-md border p-1">
            {search.data.map(result => (
              <li key={result.itunesId}>
                <button
                  type="button"
                  className="
                    w-full rounded-sm px-2 py-1 text-left text-sm
                    hover:bg-accent hover:text-accent-foreground
                  "
                  onClick={() => {
                    onSelect(result);
                    setQuery("");
                  }}
                >
                  {podcastSummary(result)}
                </button>
              </li>
            ))}
          </ul>
        )
        : null}
      <p className="text-xs text-muted-foreground">
        Search Apple Podcasts to fill in the podcast details automatically.
      </p>
    </div>
  );
}
