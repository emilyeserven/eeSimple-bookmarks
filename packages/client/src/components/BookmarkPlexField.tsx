import type { Bookmark } from "@eesimple/types";

import { useConnectors } from "../hooks/useConnectors";
import { useBookmarkPlexLink } from "../hooks/useMovies";
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

/**
 * The bookmark's linked Plex item as a detail-view value: the item title, deep-linked into Plex's
 * web UI when the connector is enabled and the server's machineIdentifier is known. Resolves through
 * whichever Plex-backed taxonomy FK is linked (Movie/TV Show/Episode/Album/Track), else the
 * bookmark's legacy `plexRatingKey`/`plexItemTitle` columns — see `useBookmarkPlexLink`. Returns
 * `null` when the bookmark isn't linked either way. Owns its `useConnectors()` call so the pure
 * detail-section builders can render it directly.
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
 * The bookmark detail page's "Plex" `DetailField` row — self-gating: resolves the effective Plex
 * link and renders nothing when unlinked, so the pure `bookmarkDetailSections` builder (which can't
 * call hooks itself) can render this row unconditionally.
 */
export function BookmarkPlexDetailRow({
  bookmark,
}: { bookmark: Bookmark }) {
  const link = useBookmarkPlexLink(bookmark);
  if (!link) return null;
  return (
    <DetailField label="Plex">
      <BookmarkPlexDetailLink bookmark={bookmark} />
    </DetailField>
  );
}
