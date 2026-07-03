import type { Bookmark } from "@eesimple/types";
import type { ReactNode } from "react";

import { BookmarkKavitaLinkButton, BookmarkPlexLinkButton } from "./BookmarkCardActions";
import { useBookmarkKavitaLink } from "../hooks/useBooks";
import { useConnectors } from "../hooks/useConnectors";
import { useBookmarkPlexLink } from "../hooks/useMovies";

/**
 * The Kavita / Plex "view on source" link-out nodes for a bookmark card, gated on the connector
 * being configured and the bookmark carrying a linkage — `null` when either is missing, same as
 * the card body's inline computation. Shared by {@link BookmarkCardDetails} (body-zone rendering)
 * and `bookmarkCardOverlayItems.tsx` (image-corner rendering) so both surfaces agree on when the
 * button shows.
 */
export function useBookmarkCardLinkOutNodes(bookmark: Bookmark): {
  kavitaLinkNode: ReactNode | null;
  plexLinkNode: ReactNode | null;
} {
  const {
    data: connectors,
  } = useConnectors();

  const kavitaBaseUrl = connectors?.kavita.enabled ? connectors.kavita.baseUrl : null;
  const kavitaLink = useBookmarkKavitaLink(bookmark);
  const kavitaLinkNode = kavitaBaseUrl !== null && kavitaLink !== null && kavitaLink.libraryId !== null
    ? (
      <BookmarkKavitaLinkButton
        baseUrl={kavitaBaseUrl}
        libraryId={kavitaLink.libraryId}
        seriesId={kavitaLink.seriesId}
      />
    )
    : null;

  const plexConnector = connectors?.plex.enabled ? connectors.plex : null;
  const plexLink = useBookmarkPlexLink(bookmark);
  const plexLinkNode = plexConnector?.baseUrl && plexConnector.machineIdentifier && plexLink !== null
    ? (
      <BookmarkPlexLinkButton
        baseUrl={plexConnector.baseUrl}
        machineIdentifier={plexConnector.machineIdentifier}
        ratingKey={plexLink.ratingKey}
      />
    )
    : null;

  return {
    kavitaLinkNode,
    plexLinkNode,
  };
}
