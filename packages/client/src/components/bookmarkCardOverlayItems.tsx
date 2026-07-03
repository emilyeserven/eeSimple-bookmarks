import type { BookmarkCardMenuControls } from "./BookmarkCardActions";
import type { CardOverlayItem } from "./CardImageOverlays";
import type { BookmarkValueItem, ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, Category } from "@eesimple/types";

import { BookmarkExternalLinkButton, BookmarkMoreMenu } from "./BookmarkCardActions";
import { buildCardOverlayItems } from "./bookmarkCardOverlays";
import { useBookmarkCardLinkOutNodes } from "./useBookmarkCardLinkOutNodes";

/**
 * Build the image-corner overlay items for a bookmark card, wiring the interactive header actions
 * (Open Link, More) from the same menu controls the card body uses, plus the Kavita/Plex link-out
 * nodes (shared with the card body via `useBookmarkCardLinkOutNodes` so both surfaces agree on when
 * they show). Keeps the overlay-building imports out of `BookmarkCard`.
 */
export function useBookmarkCardOverlayItems(
  bookmark: Bookmark,
  valueItems: BookmarkValueItem[],
  placements: Map<string, ResolvedFieldPlacement>,
  bookmarkCategory: Category | undefined,
  menu: BookmarkCardMenuControls,
  hideWebsiteForYouTube = false,
): CardOverlayItem[] {
  const {
    kavitaLinkNode, plexLinkNode,
  } = useBookmarkCardLinkOutNodes(bookmark);
  return buildCardOverlayItems(bookmark, valueItems, placements, bookmarkCategory, hideWebsiteForYouTube, {
    externalLink: <BookmarkExternalLinkButton url={bookmark.url ?? ""} />,
    more: (
      <BookmarkMoreMenu
        bookmark={bookmark}
        {...menu}
      />
    ),
    kavitaLink: kavitaLinkNode ?? undefined,
    plexLink: plexLinkNode ?? undefined,
  });
}
