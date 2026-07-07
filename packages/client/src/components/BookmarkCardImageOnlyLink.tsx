import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

/**
 * Image-only card view: wraps the bookmark image in a link to the bookmark, the same way the card
 * title links.
 */
export function BookmarkCardImageOnlyLink({
  bookmarkId, children,
}: { bookmarkId: string;
  children: ReactNode; }) {
  return (
    <Link
      to="/bookmarks/$bookmarkId"
      params={{
        bookmarkId,
      }}
      className="block"
    >
      {children}
    </Link>
  );
}
