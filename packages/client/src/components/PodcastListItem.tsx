import type { Podcast } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, Podcast as PodcastIcon } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the podcasts listing. The card body links to the podcast's detail page and the
 * badge counts linked bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function PodcastListItem({
  podcast,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  podcast: Podcast;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage,
    onError,
  } = useEntityImage(podcast.imageUrl);

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={(
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-sm bg-muted text-muted-foreground
          "
        >
          {showImage
            ? (
              <img
                src={podcast.imageUrl ?? undefined}
                alt=""
                className="size-full object-contain"
                onError={onError}
              />
            )
            : <PodcastIcon className="size-4" />}
        </span>
      )}
      title={podcast.name}
      subtitle={podcast.author ?? undefined}
      count={podcast.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/podcasts/$podcastSlug/general"
          params={{
            podcastSlug: podcast.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "podcast", podcast.id, podcast.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/podcasts/$podcastSlug/edit"
            params={{
              podcastSlug: podcast.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "podcast", podcast.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {podcast.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/podcasts/$podcastSlug/general"
            params={{
              podcastSlug: podcast.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "podcast", podcast.id, podcast.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {podcast.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
