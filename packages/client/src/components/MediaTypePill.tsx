import type { BookmarkMediaType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { MediaTypeHierarchyHoverCard } from "./MediaTypeHierarchyHoverCard";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { entityLinkTitle } from "@/lib/sidebarModifier";

interface MediaTypePillProps {
  mediaType: BookmarkMediaType;
  /** Show the media type's ancestor chain in a hover popover (the `showMediaTypeHierarchyOnHover` placement knob). */
  showHierarchyOnHover?: boolean;
}

/** A clickable pill showing a media type's icon and name. Navigates to the media type page; hold the modifier key to open in the sidebar. */
export function MediaTypePill({
  mediaType, showHierarchyOnHover = false,
}: MediaTypePillProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const link = (
    <Link
      to="/taxonomies/media-types/$mediaTypeSlug"
      params={{
        mediaTypeSlug: mediaType.slug,
      }}
      title={entityLinkTitle(modifier)}
      onClick={event => viewClick(event, "media-type", mediaType.id, mediaType.slug)}
    >
      <Badge
        variant="secondary"
        className="inline-flex items-center gap-1"
      >
        <CategoryIcon
          name={mediaType.icon}
          className="size-3 shrink-0"
        />
        {mediaType.name}
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
