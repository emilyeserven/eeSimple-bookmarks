import type { Track } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Music, Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the tracks listing. The card body links to the track's detail page and the badge
 * counts linked bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function TrackListItem({
  track,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  track: Track;
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
      icon={<Music className="size-5 shrink-0 text-muted-foreground" />}
      title={track.name}
      subtitle={track.year ? String(track.year) : undefined}
      count={track.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/tracks/$trackSlug"
          params={{
            trackSlug: track.slug,
          }}
          title={`Show bookmarks for ${track.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/tracks/$trackSlug/edit"
            params={{
              trackSlug: track.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "track", track.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {track.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/tracks/$trackSlug/general"
            params={{
              trackSlug: track.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "track", track.id, track.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {track.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
