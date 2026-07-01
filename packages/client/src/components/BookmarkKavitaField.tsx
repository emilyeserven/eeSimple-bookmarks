import type { Bookmark, KavitaSeriesResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Loader2, X } from "lucide-react";

import { useConnectors } from "../hooks/useConnectors";
import { kavitaApi } from "../lib/api/kavita";
import { kavitaSeriesUrl } from "../lib/kavita";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * The linked Kavita series as a detail-view value: the series name, deep-linked into Kavita's web
 * UI when the connector is enabled. Returns `null` when the bookmark isn't linked. Owns its
 * `useConnectors()` call so the pure detail-section builders can render it directly.
 */
export function BookmarkKavitaDetailLink({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    data: connectors,
  } = useConnectors();
  if (bookmark.kavitaSeriesId === null) return null;
  const name = bookmark.kavitaSeriesName ?? `Series #${bookmark.kavitaSeriesId}`;
  const baseUrl = connectors?.kavita.enabled ? connectors.kavita.baseUrl : null;
  if (!baseUrl || bookmark.kavitaLibraryId === null) return <span>{name}</span>;
  return (
    <a
      href={kavitaSeriesUrl(baseUrl, bookmark.kavitaLibraryId, bookmark.kavitaSeriesId)}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {name}
    </a>
  );
}

interface BookmarkKavitaFieldProps {
  bookmark: Bookmark;
  /** Persists the selection (or `null` to unlink) — the controller's immediate-save handler. */
  onSelect: (selection: KavitaSeriesResult | null) => void;
}

/** One-line summary of a search hit: name — library (year). */
function seriesSummary(series: KavitaSeriesResult): string {
  const parts = [series.libraryName, series.releaseYear ? String(series.releaseYear) : null]
    .filter(Boolean)
    .join(", ");
  return parts ? `${series.name} — ${parts}` : series.name;
}

/**
 * Link a bookmark to a series on the connected Kavita server. Renders nothing when the Kavita
 * connector is unconfigured. Unlinked, it offers a debounced series search (proxied through the
 * middleware so the API key stays server-side); linked, it shows the series name with a deep link
 * into Kavita's web UI and a clear button. Selection and clearing save immediately (like Tags),
 * outside the tab's Save-changes submit.
 */
export function BookmarkKavitaField({
  bookmark,
  onSelect,
}: BookmarkKavitaFieldProps) {
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

  const baseUrl = connectors.kavita.baseUrl;
  const linked = bookmark.kavitaSeriesId !== null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-kavita-series">Kavita series</Label>
      {linked
        ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <BookOpen className="size-4 shrink-0 text-muted-foreground" />
            {baseUrl && bookmark.kavitaLibraryId !== null && bookmark.kavitaSeriesId !== null
              ? (
                <a
                  href={kavitaSeriesUrl(baseUrl, bookmark.kavitaLibraryId, bookmark.kavitaSeriesId)}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    flex min-w-0 items-center gap-1 text-sm font-medium
                    underline-offset-2
                    hover:underline
                  "
                >
                  <span className="truncate">{bookmark.kavitaSeriesName ?? `Series #${bookmark.kavitaSeriesId}`}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )
              : (
                <span className="truncate text-sm font-medium">
                  {bookmark.kavitaSeriesName ?? `Series #${bookmark.kavitaSeriesId}`}
                </span>
              )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto size-6 shrink-0"
              aria-label="Unlink Kavita series"
              onClick={() => onSelect(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
        : (
          <>
            <div className="relative">
              <Input
                id="bookmark-kavita-series"
                placeholder="Search your Kavita library…"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              {search.isFetching
                ? (
                  <Loader2
                    className="
                      absolute top-1/2 right-3 size-4 -translate-y-1/2
                      animate-spin text-muted-foreground
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
              Link this bookmark to a series on your Kavita server.
            </p>
          </>
        )}
    </div>
  );
}
