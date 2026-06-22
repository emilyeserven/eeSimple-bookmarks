import type { Tag, YouTubeChannelCategory } from "@eesimple/types";
import type { ReactNode } from "react";

import { Fragment } from "react";

import { Link } from "@tanstack/react-router";

import { CategoryPill } from "./CategoryPill";
import { MediaTypePill } from "./MediaTypePill";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useTags } from "../hooks/useTags";

import { Badge } from "@/components/ui/badge";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

interface SourceAutofillDefaultsProps {
  /** Wording differs for a website ("this site") vs a YouTube channel ("this channel") vs a newsletter. */
  kind: "website" | "channel" | "newsletter";
  /** The source's default category, applied to new bookmarks saved from it. */
  category?: YouTubeChannelCategory | null;
  /** The source's default media type id, applied to new bookmarks saved from it. */
  mediaTypeId?: string | null;
  /** The source's default tag ids, applied to new bookmarks saved from it. */
  tagIds?: string[];
}

/** A clickable pill showing a tag's name; navigates to the tag page (or opens it in the sidebar). */
function TagPill({
  tag,
}: { tag: Tag }) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
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
 * A subtle note surfacing that a website's / YouTube channel's own default category, media type, and
 * tags are automatically applied to new bookmarks saved from it. Renders nothing when the source has
 * no defaults.
 */
export function SourceAutofillDefaults({
  kind, category, mediaTypeId, tagIds,
}: SourceAutofillDefaultsProps) {
  const {
    data: tags,
  } = useTags();
  const {
    data: mediaTypes,
  } = useMediaTypes();

  const resolvedTags = (tagIds ?? [])
    .map(id => (tags ?? []).find(tag => tag.id === id))
    .filter((tag): tag is Tag => Boolean(tag));
  const mediaType = mediaTypeId
    ? (mediaTypes ?? []).find(mt => mt.id === mediaTypeId) ?? null
    : null;

  const hasTags = resolvedTags.length > 0;
  if (!category && !mediaType && !hasTags) return null;

  const source = kind === "website"
    ? "this site"
    : kind === "newsletter"
      ? "this newsletter"
      : "this channel";

  // Each default contributes a clause; clauses are joined with "and".
  const clauses: ReactNode[] = [];
  if (category) {
    clauses.push(
      <>
        <span>added to</span>
        <CategoryPill category={category} />
      </>,
    );
  }
  if (mediaType) {
    clauses.push(
      <>
        <span>marked as</span>
        <MediaTypePill mediaType={mediaType} />
      </>,
    );
  }
  if (hasTags) {
    clauses.push(
      <>
        <span>tagged</span>
        {resolvedTags.map(tag => (
          <TagPill
            key={tag.id}
            tag={tag}
          />
        ))}
      </>,
    );
  }

  return (
    <p
      className="
        flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/50 p-4
        text-sm text-muted-foreground
      "
    >
      <span>{`New bookmarks saved from ${source} are automatically`}</span>
      {clauses.map((clause, index) => (
        <Fragment key={index}>
          {index > 0 ? <span>and</span> : null}
          {clause}
        </Fragment>
      ))}
    </p>
  );
}
