import type { Episode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, Tv2 } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the episodes listing. The card body links to the episode's detail page and the badge
 * counts linked bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function EpisodeListItem({
  episode,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  episode: Episode;
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
      icon={<Tv2 className="size-5 shrink-0 text-muted-foreground" />}
      title={episode.name}
      subtitle={episode.year ? String(episode.year) : undefined}
      count={episode.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/episodes/$episodeSlug/general"
          params={{
            episodeSlug: episode.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "episode", episode.id, episode.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/episodes/$episodeSlug/edit"
            params={{
              episodeSlug: episode.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "episode", episode.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {episode.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/episodes/$episodeSlug/general"
            params={{
              episodeSlug: episode.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "episode", episode.id, episode.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {episode.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
