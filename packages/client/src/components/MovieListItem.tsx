import type { Movie } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Film, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the movies listing. The card body links to the movie's detail page and the badge
 * counts linked bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function MovieListItem({
  movie,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  movie: Movie;
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
  } = useEntityImage(movie.imageUrl);

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
                src={movie.imageUrl ?? undefined}
                alt=""
                className="size-full object-contain"
                onError={onError}
              />
            )
            : <Film className="size-4" />}
        </span>
      )}
      title={movie.name}
      subtitle={movie.year ? String(movie.year) : undefined}
      count={movie.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/movies/$movieSlug"
          params={{
            movieSlug: movie.slug,
          }}
          title={t("Show bookmarks for {{name}}", {
            name: movie.name,
          })}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/movies/$movieSlug/edit"
            params={{
              movieSlug: movie.slug,
            }}
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "movie", movie.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: movie.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/movies/$movieSlug/info"
            params={{
              movieSlug: movie.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "movie", movie.id, movie.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">{t("View {{name}}", {
              name: movie.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
