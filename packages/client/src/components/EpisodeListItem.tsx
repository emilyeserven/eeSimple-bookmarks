import type { Episode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, Tv2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
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
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage, onError,
  } = useEntityImage(episode.imageUrl);

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
                src={episode.imageUrl ?? undefined}
                alt=""
                className="size-full object-contain"
                onError={onError}
              />
            )
            : <Tv2 className="size-4" />}
        </span>
      )}
      title={episode.name}
      subtitle={episode.year ? String(episode.year) : undefined}
      count={episode.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/episodes/$episodeSlug"
          params={{
            episodeSlug: episode.slug,
          }}
          title={t("Show bookmarks for {{name}}", {
            name: episode.name,
          })}
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "episode", episode.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: episode.name,
            })}
            </span>
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
            <span className="sr-only">{t("View {{name}}", {
              name: episode.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
