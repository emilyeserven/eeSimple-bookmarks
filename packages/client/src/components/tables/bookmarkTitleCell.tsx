import type { Bookmark } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

import { ImageCell } from "./cells";
import { useViewPanelClick } from "../panel/useEditPanelClick";

import { useSidebarOpenModifier } from "@/hooks/useAppSettings";
import { entityLinkTitle } from "@/lib/sidebarModifier";

/** The title cell: a panel-aware link to the bookmark with its website favicon. */
export function BookmarkTitleColumnCell({
  bookmark,
}: { bookmark: Bookmark }) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <Link
      to="/bookmarks/$bookmarkId"
      params={{
        bookmarkId: bookmark.id,
      }}
      title={entityLinkTitle(modifier)}
      onClick={event => viewClick(event, "bookmark", bookmark.id, bookmark.id)}
      className="
        flex items-center gap-2 font-medium
        hover:underline
      "
    >
      <ImageCell
        src={bookmark.website?.imageUrl}
        fallback={<Globe className="size-4" />}
      />
      <span className="line-clamp-2">{bookmark.title}</span>
    </Link>
  );
}
