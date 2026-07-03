import type { Bookmark } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { orderRomanized } from "@eesimple/types";
import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useShowRomanizedByDefault, useSidebarOpenModifier } from "../hooks/useAppSettings";

import { entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * The bookmark title rendered as a navigation link. Encapsulates `useViewPanelClick`,
 * `useSidebarOpenModifier`, and `useShowRomanizedByDefault` so those hooks are counted outside
 * `BookmarkCardDetails`. Renders the **primary** of the title / romanized pair per the global "Show
 * Romanized by default" toggle; the de-emphasized secondary is the separately placeable
 * `romanizedName` card field (see {@link BookmarkRomanizedField}).
 */
export function BookmarkTitleLink({
  bookmark,
}: { bookmark: Bookmark }) {
  const viewClick = useViewPanelClick();
  const sidebarModifier = useSidebarOpenModifier();
  const showRomanizedFirst = useShowRomanizedByDefault();
  const {
    primary,
  } = orderRomanized(bookmark.title, bookmark.romanizedName, showRomanizedFirst);
  return (
    <h3 className="font-semibold">
      <Link
        to="/bookmarks/$bookmarkId"
        params={{
          bookmarkId: bookmark.id,
        }}
        title={entityLinkTitle(sidebarModifier)}
        onClick={event => viewClick(event, "bookmark", bookmark.id, bookmark.id)}
        className="
          wrap-break-word text-primary
          hover:underline
        "
      >
        {primary}
      </Link>
    </h3>
  );
}

/**
 * The placeable `romanizedName` card field: the **secondary** of the title / romanized pair per the
 * global "Show Romanized by default" toggle (romanized when the toggle is off, the native title when
 * it's on), de-emphasized. Renders nothing when there is no romanized value. Owns its own
 * `useShowRomanizedByDefault` hook so it stays out of `BookmarkCardDetails`'s hook count.
 */
export function BookmarkRomanizedField({
  bookmark,
}: { bookmark: Bookmark }) {
  const showRomanizedFirst = useShowRomanizedByDefault();
  const {
    secondary,
  } = orderRomanized(bookmark.title, bookmark.romanizedName, showRomanizedFirst);
  if (!secondary) return null;
  return <span className="truncate text-sm text-muted-foreground">{secondary}</span>;
}

/**
 * Renders a bookmark description inside a fade-clamp box. Manages its own resize
 * observer so the overflow check stays out of the parent component's hook count.
 */
export function DescriptionOverflowDiv({
  description,
}: { description: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [description]);

  return (
    <div
      ref={ref}
      className="relative max-h-24 overflow-hidden"
    >
      <p className="text-sm/6 text-foreground">{description}</p>
      {overflows
        ? (
          <div
            className="
              pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t
              from-card to-transparent
            "
          />
        )
        : null}
    </div>
  );
}
