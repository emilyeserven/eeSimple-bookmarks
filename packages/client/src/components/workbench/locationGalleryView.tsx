import type { BookmarkImage, LocationNode } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSidebarOpenModifier } from "@/hooks/useAppSettings";
import { useBookmarks } from "@/hooks/useBookmarks";
import { entityLinkTitle } from "@/lib/sidebarModifier";
import { subtreeIds } from "@/lib/tagTree";

interface Tile {
  image: BookmarkImage;
  bookmarkId: string;
  bookmarkTitle: string;
}

export function LocationGalleryView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const {
    data: bookmarks, isLoading,
  } = useBookmarks();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const locationIds = includeDescendants ? new Set(subtreeIds(node)) : new Set([node.id]);
  const matching = (bookmarks ?? []).filter(b => b.locations.some(l => locationIds.has(l.id)));
  const tiles: Tile[] = matching.flatMap(b => b.images.map(image => ({
    image,
    bookmarkId: b.id,
    bookmarkTitle: b.title,
  })));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Images</h2>
          <Badge variant="secondary">{tiles.length}</Badge>
        </div>
        {node.children.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="loc-gallery-descendants"
              checked={includeDescendants}
              onCheckedChange={checked => setIncludeDescendants(checked === true)}
            />
            <Label
              htmlFor="loc-gallery-descendants"
              className="cursor-pointer"
            >
              Include sub-locations
            </Label>
          </div>
        )}
      </div>
      {tiles.length === 0
        ? <p className="text-muted-foreground">No images for this location yet.</p>
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
