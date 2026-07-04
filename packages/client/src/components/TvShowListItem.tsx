import type { TvShow } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, Tv } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the TV-shows listing. The card body links to the show's detail page and the badge
 * counts linked bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function TvShowListItem({
  tvShow,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  tvShow: TvShow;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage, onError,
  } = useEntityImage(tvShow.imageUrl);

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
                src={tvShow.imageUrl ?? undefined}
                alt=""
                className="size-full object-contain"
                onError={onError}
              />
            )
            : <Tv className="size-4" />}
        </span>
      )}
      title={tvShow.name}
      subtitle={tvShow.year ? String(tvShow.year) : undefined}
      count={tvShow.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/tv-shows/$tvShowSlug/general"
          params={{
            tvShowSlug: tvShow.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "tv-show", tvShow.id, tvShow.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/tv-shows/$tvShowSlug/edit"
            params={{
              tvShowSlug: tvShow.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "tv-show", tvShow.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {tvShow.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/tv-shows/$tvShowSlug/general"
            params={{
              tvShowSlug: tvShow.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "tv-show", tvShow.id, tvShow.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {tvShow.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
