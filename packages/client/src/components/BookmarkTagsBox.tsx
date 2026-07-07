import type { BookmarkTag } from "@eesimple/types";

import { Fragment } from "react";

import { Link } from "@tanstack/react-router";

import { ScrollFadeBox } from "./ScrollFadeBox";
import { TagHierarchyHoverCard } from "./TagHierarchyHoverCard";

import { Badge } from "@/components/ui/badge";

interface TagsBoxProps {
  tags: BookmarkTag[];
  /** Show the tag's ancestor chain in a hover popover (the `showTagHierarchyOnHover` placement knob). */
  showHierarchyOnHover?: boolean;
}

/** Scrollable, fading box of a bookmark's tag badges. */
export function BookmarkTagsBox({
  tags, showHierarchyOnHover = false,
}: TagsBoxProps) {
  return (
    <ScrollFadeBox itemCount={tags.length}>
      {tags.map((tag) => {
        const link = (
          <Link
            to="/tags/$tagSlug/info"
            params={{
              tagSlug: tag.slug,
            }}
            title={tag.name}
          >
            <Badge variant="secondary">{tag.name}</Badge>
          </Link>
        );
        return (
          <li key={tag.id}>
            {showHierarchyOnHover
              ? (
                <TagHierarchyHoverCard tag={tag}>
                  {link}
                </TagHierarchyHoverCard>
              )
              : link}
          </li>
        );
      })}
    </ScrollFadeBox>
  );
}

/**
 * Inline, comma-separated tag links — the `card-table` zone's clickable form of a bookmark's tags
 * (opt-in via the placement's `clickableTags` knob). Each name links to the tag's page like the
 * {@link BookmarkTagsBox} badges, but laid out as plain inline text to fit the table value column.
 */
export function BookmarkTagLinks({
  tags, showHierarchyOnHover = false,
}: TagsBoxProps) {
  return (
    <span className="text-sm">
      {tags.map((tag, index) => {
        const link = (
          <Link
            to="/tags/$tagSlug/info"
            params={{
              tagSlug: tag.slug,
            }}
            title={tag.name}
            className="
              text-primary
              hover:underline
            "
          >
            {tag.name}
          </Link>
        );
        return (
          <Fragment key={tag.id}>
            {index > 0 ? ", " : null}
            {showHierarchyOnHover
              ? (
                <TagHierarchyHoverCard tag={tag}>
                  {link}
                </TagHierarchyHoverCard>
              )
              : link}
          </Fragment>
        );
      })}
    </span>
  );
}
