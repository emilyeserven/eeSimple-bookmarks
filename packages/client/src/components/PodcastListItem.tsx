import type { Podcast } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, Podcast as PodcastIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();
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
      count={podcast.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/podcasts/$podcastSlug"
          params={{
            podcastSlug: podcast.slug,
          }}
          title={t("Show bookmarks for {{name}}", {
            name: podcast.name,
          })}
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "podcast", podcast.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: podcast.name,
            })}
            </span>
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
            <span className="sr-only">{t("View {{name}}", {
              name: podcast.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
