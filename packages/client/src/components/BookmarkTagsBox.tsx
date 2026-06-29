import type { BookmarkTag } from "@eesimple/types";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { entityLinkTitle } from "@/lib/sidebarModifier";

interface TagsBoxProps {
  tags: BookmarkTag[];
}

/** Scrollable, fading box of a bookmark's tag badges. */
export function BookmarkTagsBox({
  tags,
}: TagsBoxProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowTop(el.scrollTop > 0);
    setShowBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    sync();
  }, [tags.length, sync]);

  return (
    <div className="relative mt-2">
      <ul
        ref={ref}
        onScroll={sync}
        className="
          flex max-h-20 flex-wrap gap-1 overflow-y-auto rounded-md border p-1
        "
      >
        {tags.map(tag => (
          <li key={tag.id}>
            <Link
              to="/tags/$tagSlug/general"
              params={{
                tagSlug: tag.slug,
              }}
              title={entityLinkTitle(modifier)}
              onClick={event => viewClick(event, "tag", tag.id, tag.slug)}
            >
              <Badge variant="secondary">{tag.name}</Badge>
            </Link>
          </li>
        ))}
      </ul>
      {showTop
        ? (
          <div
            className="
              pointer-events-none absolute inset-x-0 top-0 h-5 rounded-t-md
              bg-linear-to-b from-card to-transparent
            "
          />
        )
        : null}
      {showBottom
        ? (
          <div
            className="
              pointer-events-none absolute inset-x-0 bottom-0 h-5 rounded-b-md
              bg-linear-to-t from-card to-transparent
            "
          />
        )
        : null}
    </div>
  );
}

/**
 * Inline, comma-separated tag links — the `card-table` zone's clickable form of a bookmark's tags
 * (opt-in via the placement's `clickableTags` knob). Each name links to the tag's page like the
 * {@link BookmarkTagsBox} badges, but laid out as plain inline text to fit the table value column.
 */
export function BookmarkTagLinks({
  tags,
}: TagsBoxProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <span className="text-sm">
      {tags.map((tag, index) => (
        <Fragment key={tag.id}>
          {index > 0 ? ", " : null}
          <Link
            to="/tags/$tagSlug/general"
            params={{
              tagSlug: tag.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "tag", tag.id, tag.slug)}
            className="
              text-primary
              hover:underline
            "
          >
            {tag.name}
          </Link>
        </Fragment>
      ))}
    </span>
  );
}
