import type { Bookmark, KavitaSeriesResult } from "@eesimple/types";

import { BookOpen, ExternalLink, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useBookmarkKavitaLink } from "../hooks/useBooks";
import { useConnectors } from "../hooks/useConnectors";
import { useKavitaSeriesSearch } from "../hooks/useKavitaSeriesSearch";
import { kavitaSeriesUrl } from "../lib/kavita";

import { DetailField } from "@/components/DetailField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The linked Kavita series as a detail-view value: the series name, deep-linked into Kavita's web
 * UI when the connector is enabled. Resolves through the linked Book (`bookmark.bookId`) when one
 * carries the Kavita linkage, else the bookmark's legacy columns — see `useBookmarkKavitaLink`.
 * Returns `null` when the bookmark isn't linked either way. Owns its `useConnectors()` call so the
 * pure detail-section builders can render it directly.
 */
export function BookmarkKavitaDetailLink({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    t,
  } = useTranslation();
  const {
    data: connectors,
  } = useConnectors();
  const link = useBookmarkKavitaLink(bookmark);
  if (!link) return null;
  const name = link.seriesName ?? t("Series #{{id}}", {
    id: link.seriesId,
  });
  const baseUrl = connectors?.kavita.enabled ? connectors.kavita.baseUrl : null;
  if (!baseUrl || link.libraryId === null) return <span>{name}</span>;
  return (
    <a
      href={kavitaSeriesUrl(baseUrl, link.libraryId, link.seriesId)}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {name}
    </a>
  );
}

/**
 * The bookmark detail page's "Kavita" `DetailField` row — self-gating: resolves the effective
 * Kavita link and renders nothing when unlinked, so the pure `bookmarkDetailSections` builder (which
 * can't call hooks itself) can render this row unconditionally.
 */
export function BookmarkKavitaDetailRow({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    t,
  } = useTranslation();
  const link = useBookmarkKavitaLink(bookmark);
  if (!link) return null;
  return (
    <DetailField label={t("Kavita")}>
      <BookmarkKavitaDetailLink bookmark={bookmark} />
    </DetailField>
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
    t,
  } = useTranslation();
  const {
    query, setQuery, enabled, baseUrl, search,
  } = useKavitaSeriesSearch();

  if (!enabled) return null;

  const linked = bookmark.kavitaSeriesId !== null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-kavita-series">{t("Kavita series")}</Label>
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
                  <span className="truncate">{bookmark.kavitaSeriesName ?? t("Series #{{id}}", {
                    id: bookmark.kavitaSeriesId,
                  })}
                  </span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )
              : (
                <span className="truncate text-sm font-medium">
                  {bookmark.kavitaSeriesName ?? t("Series #{{id}}", {
                    id: bookmark.kavitaSeriesId,
                  })}
                </span>
              )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto size-6 shrink-0"
              aria-label={t("Unlink Kavita series")}
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
                placeholder={t("Search your Kavita library…")}
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
              ? <p className="text-xs text-muted-foreground">{t("No matching series found.")}</p>
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
              {t("Link this bookmark to a series on your Kavita server.")}
            </p>
          </>
        )}
    </div>
  );
}
