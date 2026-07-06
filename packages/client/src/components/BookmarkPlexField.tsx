import type { MediaTaxonomyKind } from "../hooks/useMovies";
import type { Bookmark, PlexItemResult } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { ExternalLink, Film, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useBookmarkPlexSearch } from "../hooks/useBookmarkPlexSearch";
import { useConnectors } from "../hooks/useConnectors";
import { useBookmarkMediaTaxonomyLink, useBookmarkPlexLink } from "../hooks/useMovies";
import { plexItemUrl } from "../lib/plex";

import { DetailField } from "@/components/DetailField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The Plex web-UI deep link for a resolved rating key, or `null` when the link can't be built. */
function plexUrlFor(
  ratingKey: string,
  connectors: ReturnType<typeof useConnectors>["data"],
): string | null {
  const plex = connectors?.plex;
  if (!plex?.enabled || !plex.baseUrl || !plex.machineIdentifier) return null;
  return plexItemUrl(plex.baseUrl, plex.machineIdentifier, ratingKey);
}

/** A linked Media Property taxonomy row, rendered as an in-app link to its own term page. */
function MediaTaxonomyDetailLink({
  kind, title, slug,
}: { kind: MediaTaxonomyKind;
  title: string;
  slug: string; }) {
  const className = "hover:underline";
  switch (kind) {
    case "book":
      return (
        <Link
          to="/taxonomies/books/$bookSlug"
          params={{
            bookSlug: slug,
          }}
          className={className}
        >
          {title}
        </Link>
      );
    case "podcast":
      return (
        <Link
          to="/taxonomies/podcasts/$podcastSlug"
          params={{
            podcastSlug: slug,
          }}
          className={className}
        >
          {title}
        </Link>
      );
    case "movie":
      return (
        <Link
          to="/taxonomies/movies/$movieSlug"
          params={{
            movieSlug: slug,
          }}
          className={className}
        >
          {title}
        </Link>
      );
    case "tvShow":
      return (
        <Link
          to="/taxonomies/tv-shows/$tvShowSlug"
          params={{
            tvShowSlug: slug,
          }}
          className={className}
        >
          {title}
        </Link>
      );
    case "episode":
      return (
        <Link
          to="/taxonomies/episodes/$episodeSlug"
          params={{
            episodeSlug: slug,
          }}
          className={className}
        >
          {title}
        </Link>
      );
    case "album":
      return (
        <Link
          to="/taxonomies/albums/$albumSlug"
          params={{
            albumSlug: slug,
          }}
          className={className}
        >
          {title}
        </Link>
      );
    case "track":
      return (
        <Link
          to="/taxonomies/tracks/$trackSlug"
          params={{
            trackSlug: slug,
          }}
          className={className}
        >
          {title}
        </Link>
      );
  }
}

/**
 * The `DetailField` label for a linked Media Property taxonomy kind, e.g. `"Movie"` / `"TV Show"`.
 */
function useMediaTaxonomyLabel(kind: MediaTaxonomyKind): string {
  const {
    t,
  } = useTranslation();
  const labels: Record<MediaTaxonomyKind, string> = {
    book: t("Book"),
    podcast: t("Podcast"),
    movie: t("Movie"),
    tvShow: t("TV Show"),
    episode: t("Episode"),
    album: t("Album"),
    track: t("Track"),
  };
  return labels[kind];
}

/**
 * The bookmark's linked Plex item as a detail-view value: the item title, deep-linked into Plex's
 * web UI when the connector is enabled and the server's machineIdentifier is known. Used only for
 * the legacy case where the bookmark carries a direct `plexRatingKey`/`plexItemTitle` with no linked
 * Media Property taxonomy row (see `BookmarkMediaTaxonomyDetailRow`).
 */
export function BookmarkPlexDetailLink({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    data: connectors,
  } = useConnectors();
  const link = useBookmarkPlexLink(bookmark);
  if (!link) return null;
  const url = plexUrlFor(link.ratingKey, connectors);
  if (!url) return <span>{link.title}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {link.title}
    </a>
  );
}

/**
 * The bookmark detail page's linked-media row: labeled with the linked Media Property taxonomy's
 * name (e.g. `"Movie"`, `"Book"`) and linking to that entity's own in-app term page, resolved via
 * {@link useBookmarkMediaTaxonomyLink}. Falls back to the legacy `"Plex"` label + Plex web-UI deep
 * link when the bookmark has a direct Plex linkage but no Media Property taxonomy FK set. Renders
 * nothing when neither is available. Self-gating so the pure `bookmarkDetailSections` builder (which
 * can't call hooks itself) can render this row unconditionally.
 */
export function BookmarkPlexDetailRow({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    t,
  } = useTranslation();
  const mediaLink = useBookmarkMediaTaxonomyLink(bookmark);
  const plexLink = useBookmarkPlexLink(bookmark);
  const label = useMediaTaxonomyLabel(mediaLink?.kind ?? "movie");
  if (mediaLink) {
    return (
      <DetailField label={label}>
        <MediaTaxonomyDetailLink
          kind={mediaLink.kind}
          title={mediaLink.title}
          slug={mediaLink.slug}
        />
      </DetailField>
    );
  }
  if (!plexLink) return null;
  return (
    <DetailField label={t("Plex")}>
      <BookmarkPlexDetailLink bookmark={bookmark} />
    </DetailField>
  );
}

interface BookmarkPlexFieldProps {
  bookmark: Bookmark;
  /** Persists the selection (or `null` to unlink) — the section's immediate-save handler. */
  onSelect: (item: PlexItemResult | null) => void;
}

/** One-line summary of a search hit: title — subtitle (year / library). */
function itemSummary(item: PlexItemResult): string {
  return item.subtitle ? `${item.title} — ${item.subtitle}` : item.title;
}

/**
 * Link a bookmark directly to an item on the connected Plex server. Renders nothing when the Plex
 * connector is unconfigured. Unlinked, it offers a debounced all-kinds item search (proxied through
 * the middleware so the token stays server-side); linked, it shows the item title with a deep link
 * into Plex's web UI and a clear button. Selection and clearing save immediately (like Tags),
 * outside the tab's per-field auto-save flow — the Plex twin of `BookmarkKavitaField`.
 */
export function BookmarkPlexField({
  bookmark,
  onSelect,
}: BookmarkPlexFieldProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: connectors,
  } = useConnectors();
  const {
    query, setQuery, enabled, search,
  } = useBookmarkPlexSearch();

  if (!enabled) return null;

  const linked = bookmark.plexRatingKey !== null;
  const linkUrl = bookmark.plexRatingKey ? plexUrlFor(bookmark.plexRatingKey, connectors) : null;
  const linkedTitle = bookmark.plexItemTitle ?? bookmark.plexRatingKey ?? "";

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-plex-item">{t("Plex item")}</Label>
      {linked
        ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Film className="size-4 shrink-0 text-muted-foreground" />
            {linkUrl
              ? (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    flex min-w-0 items-center gap-1 text-sm font-medium
                    underline-offset-2
                    hover:underline
                  "
                >
                  <span className="truncate">{linkedTitle}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )
              : <span className="truncate text-sm font-medium">{linkedTitle}</span>}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto size-6 shrink-0"
              aria-label={t("Unlink Plex item")}
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
                id="bookmark-plex-item"
                placeholder={t("Search your Plex library…")}
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
              ? <p className="text-xs text-muted-foreground">{t("No matching items found.")}</p>
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
              {t("Link this bookmark to an item on your Plex server.")}
            </p>
          </>
        )}
    </div>
  );
}
