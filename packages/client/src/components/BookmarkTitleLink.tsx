import type { Bookmark } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { namesWithLegacyFallback, resolveDisplayNames } from "@eesimple/types";
import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useShowRomanizedByDefault, useSidebarOpenModifier } from "../hooks/useAppSettings";

import { entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * The bookmark title rendered as a navigation link. Encapsulates `useViewPanelClick`,
 * `useSidebarOpenModifier`, and `useShowRomanizedByDefault` so those hooks are counted outside
 * `BookmarkCardDetails`. Renders the resolved **primary** name via `resolveDisplayNames` (against
 * `bookmark.names`, falling back to the legacy `romanizedName` scalar until it's backfilled); the
 * de-emphasized secondary is the separately placeable `romanizedName` card field (see
 * {@link BookmarkRomanizedField}).
 */
export function BookmarkTitleLink({
  bookmark,
}: { bookmark: Bookmark }) {
  const viewClick = useViewPanelClick();
  const sidebarModifier = useSidebarOpenModifier();
  const showRomanizedFirst = useShowRomanizedByDefault();
  const {
    primary,
  } = resolveDisplayNames(
    namesWithLegacyFallback(bookmark.names, bookmark.romanizedName),
    showRomanizedFirst
      ? {
        id: "legacy-romanized",
      }
      : null,
    bookmark.title,
  );
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
 * The placeable `romanizedName` card field ("Secondary title"): the resolved **secondary** name via
 * `resolveDisplayNames`, de-emphasized. Renders nothing when there is no secondary name. Owns its
 * own `useShowRomanizedByDefault` hook so it stays out of `BookmarkCardDetails`'s hook count. Wraps
 * onto multiple lines (`wrap-break-word`, matching the title link) rather than truncating, so a long
 * secondary title stays fully readable on a card instead of being clipped to a single line.
 */
export function BookmarkRomanizedField({
  bookmark,
}: { bookmark: Bookmark }) {
  const showRomanizedFirst = useShowRomanizedByDefault();
  const {
    secondary,
  } = resolveDisplayNames(
    namesWithLegacyFallback(bookmark.names, bookmark.romanizedName),
    showRomanizedFirst
      ? {
        id: "legacy-romanized",
      }
      : null,
    bookmark.title,
  );
  if (!secondary) return null;
  return <span className="text-sm wrap-break-word text-muted-foreground">{secondary}</span>;
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
