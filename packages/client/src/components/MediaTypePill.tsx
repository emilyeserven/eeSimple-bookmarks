import type { BookmarkMediaType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { MediaTypeHierarchyHoverCard } from "./MediaTypeHierarchyHoverCard";

import { Badge } from "@/components/ui/badge";
import { useBuiltInName } from "@/lib/builtInName";
import { CategoryIcon } from "@/lib/icons";

interface MediaTypePillProps {
  mediaType: BookmarkMediaType;
  /** Show the media type's ancestor chain in a hover popover (the `showMediaTypeHierarchyOnHover` placement knob). */
  showHierarchyOnHover?: boolean;
}

/** A clickable pill showing a media type's icon and name. Navigates to the media type page. */
export function MediaTypePill({
  mediaType, showHierarchyOnHover = false,
}: MediaTypePillProps) {
  const builtInName = useBuiltInName();
  const link = (
    <Link
      to="/taxonomies/media-types/$mediaTypeSlug"
      params={{
        mediaTypeSlug: mediaType.slug,
      }}
      title={builtInName(mediaType)}
    >
      <Badge
        variant="secondary"
        className="inline-flex items-center gap-1"
      >
        <CategoryIcon
          name={mediaType.icon}
          className="size-3 shrink-0"
        />
        {builtInName(mediaType)}
      </Badge>
    </Link>
  );
  return showHierarchyOnHover
    ? (
      <MediaTypeHierarchyHoverCard mediaType={mediaType}>
        {link}
      </MediaTypeHierarchyHoverCard>
    )
    : link;
}
