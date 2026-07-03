import type { Artist } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Mic2, Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the artists listing. The card body links to the artist's detail page and the badge
 * counts linked bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function ArtistListItem({
  artist,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  artist: Artist;
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
      icon={<Mic2 className="size-5 shrink-0 text-muted-foreground" />}
      title={artist.name}
      subtitle={artist.year ? String(artist.year) : undefined}
      count={artist.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/artists/$artistSlug/general"
          params={{
            artistSlug: artist.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "artist", artist.id, artist.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/artists/$artistSlug/edit"
            params={{
              artistSlug: artist.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "artist", artist.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {artist.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/artists/$artistSlug/general"
            params={{
              artistSlug: artist.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "artist", artist.id, artist.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {artist.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
