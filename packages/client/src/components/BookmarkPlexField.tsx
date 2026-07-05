import type { MediaTaxonomyKind } from "../hooks/useMovies";
import type { Bookmark } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useConnectors } from "../hooks/useConnectors";
import { useBookmarkMediaTaxonomyLink, useBookmarkPlexLink } from "../hooks/useMovies";
import { plexItemUrl } from "../lib/plex";

import { DetailField } from "@/components/DetailField";

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
