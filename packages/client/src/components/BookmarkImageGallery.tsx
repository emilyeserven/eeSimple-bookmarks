import type { BookmarkImage, Bookmark } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useViewPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { useSidebarOpenModifier } from "@/hooks/useAppSettings";
import { entityLinkTitle } from "@/lib/sidebarModifier";

interface Tile {
  image: BookmarkImage;
  bookmarkId: string;
  bookmarkTitle: string;
}

/**
 * A responsive grid of every image carried by the given bookmarks, each tile linking to its
 * bookmark. Scope + filtering are owned by the caller (the listing page passes the already-filtered
 * set), so this component only flattens `bookmark.images` into tiles and renders them.
 */
export function BookmarkImageGallery({
  bookmarks,
}: {
  bookmarks: Bookmark[];
}) {
  const {
    t,
  } = useTranslation();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  const tiles: Tile[] = bookmarks.flatMap(b => b.images.map(image => ({
    image,
    bookmarkId: b.id,
    bookmarkTitle: b.title,
  })));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("Images")}</h2>
        <Badge variant="secondary">{tiles.length}</Badge>
      </div>
      {tiles.length === 0
        ? <p className="text-muted-foreground">{t("No images yet.")}</p>
        : (
          <ul
            className="
              grid grid-cols-2 gap-3
              sm:grid-cols-3
              lg:grid-cols-4
            "
          >
            {tiles.map(tile => (
              <li
                key={tile.image.id}
                className="space-y-1"
              >
                <Link
                  to="/bookmarks/$bookmarkId"
                  params={{
                    bookmarkId: tile.bookmarkId,
                  }}
                  title={entityLinkTitle(modifier)}
                  onClick={event => viewClick(event, "bookmark", tile.bookmarkId, tile.bookmarkId)}
                  className="block"
                >
                  <div
                    className="
                      flex aspect-square w-full items-center justify-center
                      overflow-hidden rounded-md border bg-muted/30
                    "
                  >
                    <img
                      src={tile.image.url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </div>
                </Link>
                <p
                  className="truncate text-sm font-medium"
                  title={tile.bookmarkTitle}
                >
                  {tile.bookmarkTitle}
                </p>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
