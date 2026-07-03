import type { Bookmark } from "@eesimple/types";

import { useConnectors } from "../hooks/useConnectors";
import { plexItemUrl } from "../lib/plex";

/** The Plex web-UI deep link for a linked bookmark, or `null` when the link can't be built. */
function linkedPlexUrl(
  bookmark: Bookmark,
  connectors: ReturnType<typeof useConnectors>["data"],
): string | null {
  if (bookmark.plexRatingKey === null) return null;
  const plex = connectors?.plex;
  if (!plex?.enabled || !plex.baseUrl || !plex.machineIdentifier) return null;
  return plexItemUrl(plex.baseUrl, plex.machineIdentifier, bookmark.plexRatingKey);
}

/**
 * The bookmark's direct Plex item link as a detail-view value (season/episode/artist/album/track, or
 * an ad-hoc movie/show not curated into the Movies/TV Shows taxonomies): the item title, deep-linked
 * into Plex's web UI when the connector is enabled and the server's machineIdentifier is known.
 * Returns `null` when the bookmark isn't directly linked — a taxonomy-linked bookmark (`movieId`/
 * `tvShowId`) clears these columns instead, so it renders nothing here (see `BookmarkPlexItemField`).
 * Owns its `useConnectors()` call so the pure detail-section builders can render it directly.
 */
export function BookmarkPlexDetailLink({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    data: connectors,
  } = useConnectors();
  if (bookmark.plexRatingKey === null) return null;
  const name = bookmark.plexItemTitle ?? `Item ${bookmark.plexRatingKey}`;
  const url = linkedPlexUrl(bookmark, connectors);
  if (!url) return <span>{name}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {name}
    </a>
  );
}
