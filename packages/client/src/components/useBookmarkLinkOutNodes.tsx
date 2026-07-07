import type { Bookmark } from "@eesimple/types";
import type { ReactNode } from "react";

import { BookmarkArchiveLinkButton, BookmarkKavitaLinkButton, BookmarkPlexLinkButton, BookmarkPodcastLinkButton } from "./BookmarkCardActions";
import { useBookmarkKavitaLink, useBookmarkPlexLink, useBookmarkPodcastLink } from "../hooks/useBookmarkMediaLinks";
import { useConnectors } from "../hooks/useConnectors";

/** The four connector deep-link buttons a bookmark card may show; each is `null` when not applicable. */
export interface BookmarkLinkOutNodes {
  archiveLinkNode: ReactNode;
  kavitaLinkNode: ReactNode;
  plexLinkNode: ReactNode;
  podcastLinkNode: ReactNode;
}

/**
 * Resolve the ArchiveBox / Kavita / Plex / Podcast deep-link buttons for a bookmark card. Each node is
 * `null` when its connector is unconfigured or the bookmark isn't linked to that source, so the caller
 * can place them like any other field. Extracted from {@link BookmarkCardDetails} to keep that
 * component's hook-and-nullish density under the complexity cap.
 */
export function useBookmarkLinkOutNodes(bookmark: Bookmark): BookmarkLinkOutNodes {
  const {
    data: connectors,
  } = useConnectors();

  // ArchiveBox base URL (link-out only); the archiveLink field renders nothing when unset.
  const archiveBaseUrl = connectors?.archiveBox.baseUrl ?? null;
  const archiveLinkNode = archiveBaseUrl !== null && bookmark.url
    ? (
      <BookmarkArchiveLinkButton
        baseUrl={archiveBaseUrl}
        url={bookmark.url}
      />
    )
    : null;

  // Kavita deep link; the kavitaLink field renders nothing when unconfigured or unlinked — resolved
  // through the linked Book when one carries the Kavita linkage, else the bookmark's legacy columns.
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

  // Plex deep link; the plexLink field renders nothing when unconfigured, unlinked, or the server's
  // machineIdentifier isn't known yet — resolved through whichever Plex-backed taxonomy is linked,
  // else the bookmark's legacy columns.
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

  // Podcast deep link; renders nothing when the bookmark isn't linked to a podcast or none of its
  // services has a URL. Public URLs, so no connector gating.
  const podcastLink = useBookmarkPodcastLink(bookmark);
  const podcastLinkNode = podcastLink !== null
    ? (
      <BookmarkPodcastLinkButton
        url={podcastLink.url}
        label={podcastLink.label}
      />
    )
    : null;

  return {
    archiveLinkNode,
    kavitaLinkNode,
    plexLinkNode,
    podcastLinkNode,
  };
}
