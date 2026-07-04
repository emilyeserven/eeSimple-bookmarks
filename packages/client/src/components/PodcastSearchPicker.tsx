import type { PodcastSearchProvider, PodcastSearchResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { PODCAST_LINK_PROVIDER_LABELS, PODCAST_SEARCH_PROVIDERS } from "@eesimple/types";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePodcastSearch, usePodcastUrlResolve } from "../hooks/usePodcasts";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/** One-line summary of a search hit: name — author. */
function podcastSummary(result: PodcastSearchResult): string {
  return result.author ? `${result.name} — ${result.author}` : result.name;
}

/** Stable list key for a hit (Pocket Casts hits have no iTunes id). */
function resultKey(result: PodcastSearchResult, index: number): string {
  return String(result.itunesId ?? result.pocketCastsUuid ?? result.feedUrl ?? index);
}

/** Whether a query looks like a pasted URL rather than a search term. */
function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  }
  catch {
    return false;
  }
}

interface PodcastSearchPickerProps {
  /** Called with a chosen podcast so the caller can prefill its fields (name/author/feed + provider link). */
  onSelect: (result: PodcastSearchResult) => void;
}

/**
 * A debounced, keyless search box that resolves a query to podcasts. A provider selector (Apple
 * Podcasts / Pocket Casts) chosen before searching picks the directory; the middleware proxies the
 * request. Pasting a URL instead of a term — an Apple Podcasts show page or a raw RSS/XML feed link —
 * resolves it directly, skipping the directory search. Selecting a result hands it to `onSelect` to
 * prefill a podcast's name / author / feed URL and the searched service's link (the others are
 * cross-resolved from the feed). Always shown (no connector to configure); modeled on
 * `KavitaSeriesLookup`, reused by the Podcast create + edit forms.
 */
export function PodcastSearchPicker({
  onSelect,
}: PodcastSearchPickerProps) {
  const {
    t,
  } = useTranslation();
  const [provider, setProvider] = useState<PodcastSearchProvider>("itunes");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const trimmedQuery = debouncedQuery.trim();
  const isUrlQuery = isHttpUrl(trimmedQuery);
  const search = usePodcastSearch(
    !isUrlQuery && trimmedQuery.length >= MIN_QUERY_LENGTH ? trimmedQuery : "",
    provider,
  );
  const urlResolve = usePodcastUrlResolve(isUrlQuery ? trimmedQuery : "");

  const isFetching = isUrlQuery ? urlResolve.isFetching : search.isFetching;
  const errorMessage = isUrlQuery
    ? (urlResolve.isError ? urlResolve.error.message : null)
    : (search.isError ? search.error.message : null);
  const results: PodcastSearchResult[] = isUrlQuery
    ? (urlResolve.isSuccess ? [urlResolve.data] : [])
    : (search.isSuccess ? search.data : []);
  const showEmptyMessage = !isUrlQuery
    && search.isSuccess && search.data.length === 0 && trimmedQuery.length >= MIN_QUERY_LENGTH;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="podcast-search-lookup">{t("Search a podcast directory")}</Label>
      <ToggleGroup
        type="single"
        size="sm"
        value={provider}
        onValueChange={(v) => {
          if (v) setProvider(v as PodcastSearchProvider);
        }}
        className="rounded-sm ring-1 ring-border"
      >
        {PODCAST_SEARCH_PROVIDERS.map(p => (
          <ToggleGroupItem
            key={p}
            value={p}
            aria-label={t(PODCAST_LINK_PROVIDER_LABELS[p])}
          >
            {t(PODCAST_LINK_PROVIDER_LABELS[p])}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="relative">
        <Input
          id="podcast-search-lookup"
          placeholder={t("Search podcasts or paste a URL…")}
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        {isFetching
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
      {errorMessage
        ? <p className="text-xs text-destructive">{errorMessage}</p>
        : null}
      {showEmptyMessage
        ? <p className="text-xs text-muted-foreground">{t("No matching podcasts found.")}</p>
        : null}
      {results.length > 0
        ? (
          <ul className="space-y-1 rounded-md border p-1">
            {results.map((result, index) => (
              <li key={resultKey(result, index)}>
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
        {t("Search Apple Podcasts or Pocket Casts, or paste its Apple Podcasts / RSS feed URL directly, to fill in the podcast details automatically; links on the other services are found from its feed.")}
      </p>
    </div>
  );
}
