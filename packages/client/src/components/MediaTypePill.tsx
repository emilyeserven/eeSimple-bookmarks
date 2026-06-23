import type { BookmarkMediaType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { entityLinkTitle } from "@/lib/sidebarModifier";

/** A clickable pill showing a media type's icon and name. Navigates to the media type page; hold the modifier key to open in the sidebar. */
export function MediaTypePill({
  mediaType,
}: { mediaType: BookmarkMediaType }) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
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
}
