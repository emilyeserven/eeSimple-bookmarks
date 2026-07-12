import type { TermDisplayProps } from "./bookmarkCardTermBadges";
import type { BookmarkTag } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Tag } from "lucide-react";

import { MoreTermsBadge, TaxonomyCountBadge, TaxonomyLinkList } from "./bookmarkCardTermBadges";
import { ScrollFadeBox } from "./ScrollFadeBox";
import { TagHierarchyHoverCard } from "./TagHierarchyHoverCard";

import { Badge } from "@/components/ui/badge";
import i18n from "@/i18n";
import { resolveTermDisplay } from "@/lib/cardTaxonomyDisplay";

interface TagsBoxProps extends TermDisplayProps {
  tags: BookmarkTag[];
  /** Show the tag's ancestor chain in a hover popover (the `showTagHierarchyOnHover` placement knob). */
  showHierarchyOnHover?: boolean;
}

/** A tag's badge, optionally wrapped in an ancestor-chain hover card. */
function TagBadge({
  tag, showHierarchyOnHover,
}: {
  tag: BookmarkTag;
  showHierarchyOnHover: boolean;
}) {
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
  return showHierarchyOnHover
    ? (
      <TagHierarchyHoverCard tag={tag}>
        {link}
      </TagHierarchyHoverCard>
    )
    : link;
}

/** Scrollable, fading box of a bookmark's tag badges. */
export function BookmarkTagsBox({
  tags, showHierarchyOnHover = false, maxTerms = null, collapseToCount = false,
}: TagsBoxProps) {
  const display = resolveTermDisplay(tags.length, {
    maxTerms,
    collapseToCount,
  });
  if (display.mode === "count") {
    return (
      <div className="mt-2 flex flex-wrap gap-1">
        <TaxonomyCountBadge
          icon={Tag}
          count={display.total}
          title={i18n.t("{{count}} tags", {
            count: display.total,
          })}
        />
      </div>
    );
  }
  const visible = display.mode === "limit" ? tags.slice(0, display.visible) : tags;
  return (
    <ScrollFadeBox itemCount={visible.length + (display.mode === "limit" ? 1 : 0)}>
      {visible.map(tag => (
        <li key={tag.id}>
          <TagBadge
            tag={tag}
            showHierarchyOnHover={showHierarchyOnHover}
          />
        </li>
      ))}
      {display.mode === "limit"
        ? (
          <li>
            <MoreTermsBadge hidden={display.hidden} />
          </li>
        )
        : null}
    </ScrollFadeBox>
  );
}

/**
 * Inline, comma-separated tag links — the `card-table` zone's clickable form of a bookmark's tags
 * (opt-in via the placement's `clickableTags` knob). Each name links to the tag's page like the
 * {@link BookmarkTagsBox} badges, but laid out as plain inline text to fit the table value column.
 */
export function BookmarkTagLinks({
  tags, showHierarchyOnHover = false, maxTerms = null, collapseToCount = false,
}: TagsBoxProps) {
  return (
    <TaxonomyLinkList
      items={tags}
      keyOf={tag => tag.id}
      maxTerms={maxTerms}
      collapseToCount={collapseToCount}
      countLabel={count => i18n.t("{{count}} tags", {
        count,
      })}
      renderLink={(tag) => {
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
        return showHierarchyOnHover
          ? (
            <TagHierarchyHoverCard tag={tag}>
              {link}
            </TagHierarchyHoverCard>
          )
          : link;
      }}
    />
  );
}
