import type { Album } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Disc3, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
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
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage, onError,
  } = useEntityImage(album.imageUrl);

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
                src={album.imageUrl ?? undefined}
                alt=""
                className="size-full object-contain"
                onError={onError}
              />
            )
            : <Disc3 className="size-4" />}
        </span>
      )}
      title={album.name}
      subtitle={album.year ? String(album.year) : undefined}
      count={album.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/albums/$albumSlug"
          params={{
            albumSlug: album.slug,
          }}
          title={t("Show bookmarks for {{name}}", {
            name: album.name,
          })}
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "album", album.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: album.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/albums/$albumSlug/info"
            params={{
              albumSlug: album.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "album", album.id, album.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">{t("View {{name}}", {
              name: album.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
