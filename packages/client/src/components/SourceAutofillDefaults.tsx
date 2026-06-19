import type { Tag, YouTubeChannelCategory } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { CategoryPill } from "./CategoryPill";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useTags } from "../hooks/useTags";

import { Badge } from "@/components/ui/badge";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface SourceAutofillDefaultsProps {
  /** Wording differs for a website ("this site") vs a YouTube channel ("this channel"). */
  kind: "website" | "channel";
  /** The source's default category, applied to new bookmarks saved from it. */
  category?: YouTubeChannelCategory | null;
  /** The source's default tag ids, applied to new bookmarks saved from it. */
  tagIds?: string[];
}

/** A clickable pill showing a tag's name; navigates to the tag page (or opens it in the sidebar). */
function TagPill({
  tag,
}: { tag: Tag }) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <Link
      to="/tags/$tagSlug"
      params={{
        tagSlug: tag.slug,
      }}
      title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
      onClick={event => viewClick(event, "tag", tag.id)}
    >
      <Badge variant="secondary">{tag.name}</Badge>
    </Link>
  );
}

/**
 * A subtle note surfacing that a website's / YouTube channel's own default category and tags are
 * automatically applied to new bookmarks saved from it. Renders nothing when the source has neither.
 */
export function SourceAutofillDefaults({
  kind, category, tagIds,
}: SourceAutofillDefaultsProps) {
  const {
    data: tags,
  } = useTags();

  const resolvedTags = (tagIds ?? [])
    .map(id => (tags ?? []).find(tag => tag.id === id))
    .filter((tag): tag is Tag => Boolean(tag));

  const hasTags = resolvedTags.length > 0;
  if (!category && !hasTags) return null;

  const source = kind === "website" ? "this site" : "this channel";

  return (
    <p
      className="
        flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground
      "
    >
      <span>{`New bookmarks saved from ${source} are automatically`}</span>
      {category
        ? (
          <>
            <span>added to</span>
            <CategoryPill category={category} />
          </>
        )
        : null}
      {category && hasTags ? <span>and</span> : null}
      {hasTags
        ? (
          <>
            <span>tagged</span>
            {resolvedTags.map(tag => (
              <TagPill
                key={tag.id}
                tag={tag}
              />
            ))}
          </>
        )
        : null}
    </p>
  );
}
