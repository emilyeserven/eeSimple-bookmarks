import type { Bookmark } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

import { ImageCell } from "./cells";

/** The title cell: a link to the bookmark with its website favicon. */
export function BookmarkTitleColumnCell({
  bookmark,
}: { bookmark: Bookmark }) {
  return (
    <Link
      to="/bookmarks/$bookmarkId"
      params={{
        bookmarkId: bookmark.id,
      }}
      title={bookmark.title}
      className="
        flex items-center gap-2 font-medium
        hover:underline
      "
    >
      <ImageCell
        src={bookmark.website?.imageUrl}
        fallback={<Globe className="size-4" />}
      />
      <span className="wrap-break-word">{bookmark.title}</span>
    </Link>
  );
}
