import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * Image-only card view: wraps the bookmark image in a link to the bookmark, the same way the card
 * title links. Owns the `useViewPanelClick` / `useSidebarOpenModifier` hooks so they're counted
 * outside `BookmarkCard`.
 */
export function BookmarkCardImageOnlyLink({
  bookmarkId, children,
}: { bookmarkId: string;
  children: ReactNode; }) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <Link
      to="/bookmarks/$bookmarkId"
      params={{
        bookmarkId,
      }}
      title={entityLinkTitle(modifier)}
      onClick={event => viewClick(event, "bookmark", bookmarkId, bookmarkId)}
      className="block"
    >
      {children}
    </Link>
  );
}
