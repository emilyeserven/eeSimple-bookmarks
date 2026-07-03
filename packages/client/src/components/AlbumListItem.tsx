import type { Album } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Disc3, Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the albums listing. The card body links to the album's detail page and the badge
 * counts linked bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function AlbumListItem({
  album,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  album: Album;
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
      icon={<Disc3 className="size-5 shrink-0 text-muted-foreground" />}
      title={album.name}
      subtitle={album.year ? String(album.year) : undefined}
      count={album.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/albums/$albumSlug/general"
          params={{
            albumSlug: album.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "album", album.id, album.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/albums/$albumSlug/edit"
            params={{
              albumSlug: album.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "album", album.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {album.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/albums/$albumSlug/general"
            params={{
              albumSlug: album.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "album", album.id, album.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {album.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
