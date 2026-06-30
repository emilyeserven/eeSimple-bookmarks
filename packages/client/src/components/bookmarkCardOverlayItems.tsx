import type { BookmarkCardMenuControls } from "./BookmarkCardActions";
import type { CardOverlayItem } from "./CardImageOverlays";
import type { BookmarkValueItem, ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, Category } from "@eesimple/types";

import { BookmarkExternalLinkButton, BookmarkMoreMenu } from "./BookmarkCardActions";
import { buildCardOverlayItems } from "./bookmarkCardOverlays";

/**
 * Build the image-corner overlay items for a bookmark card, wiring the interactive header actions
 * (Open Link, More) from the same menu controls the card body uses. Keeps the overlay-building
 * imports (`BookmarkExternalLinkButton`/`BookmarkMoreMenu`/`buildCardOverlayItems`) out of `BookmarkCard`.
 */
export function buildBookmarkCardOverlayItems(
  bookmark: Bookmark,
  valueItems: BookmarkValueItem[],
  placements: Map<string, ResolvedFieldPlacement>,
  bookmarkCategory: Category | undefined,
  menu: BookmarkCardMenuControls,
): CardOverlayItem[] {
  return buildCardOverlayItems(bookmark, valueItems, placements, bookmarkCategory, {
    externalLink: <BookmarkExternalLinkButton url={bookmark.url ?? ""} />,
    more: (
      <BookmarkMoreMenu
        bookmark={bookmark}
        {...menu}
      />
    ),
  });
}
