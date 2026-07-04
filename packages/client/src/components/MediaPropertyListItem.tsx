import type { MediaProperty } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Library, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the media-property listing. A media property has no "filtered bookmarks" page, so
 * the card body links to its detail page and the badge counts member books. The standard hover Edit +
 * Info buttons still apply.
 */
export function MediaPropertyListItem({
  mediaProperty,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  mediaProperty: MediaProperty;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={<Library className="size-5 shrink-0 text-muted-foreground" />}
      title={mediaProperty.name}
      count={mediaProperty.bookCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/media-properties/$mediaPropertySlug"
          params={{
            mediaPropertySlug: mediaProperty.slug,
          }}
          title={`Show bookmarks for ${mediaProperty.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/media-properties/$mediaPropertySlug/edit"
            params={{
              mediaPropertySlug: mediaProperty.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "media-property", mediaProperty.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {mediaProperty.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/media-properties/$mediaPropertySlug/general"
            params={{
              mediaPropertySlug: mediaProperty.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "media-property", mediaProperty.id, mediaProperty.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {mediaProperty.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
