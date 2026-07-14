import type { Website } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CategoryPill } from "./CategoryPill";
import { FavoriteToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";

import { useEntityImage } from "@/hooks/useEntityImage";

interface WebsiteListItemProps {
  website: Website;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the website listing: a favicon, a body link to the website's own bookmarks page, and hover Edit / Info. */
export function WebsiteListItem({
  website,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: WebsiteListItemProps) {
  const {
    t,
  } = useTranslation();
  const {
    showImage,
    onError,
  } = useEntityImage(website.imageUrl);
  const favorite = useFavoriteToggle("website");

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      renderExtra={() => (
        <FavoriteToggleButton
          isFavorite={Boolean(website.isFavorite)}
          name={website.siteName}
          onToggle={() => favorite.toggle({
            id: website.id,
            name: website.siteName,
            isFavorite: Boolean(website.isFavorite),
          })}
        />
      )}
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
                src={website.imageUrl ?? undefined}
                alt=""
                className="size-full object-contain"
                onError={onError}
              />
            )
            : <Globe className="size-4" />}
        </span>
      )}
      title={website.siteName}
      subtitle={website.domain}
      count={website.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/websites/$websiteSlug"
          params={{
            websiteSlug: website.slug,
          }}
          title={t("Show bookmarks from {{name}}", {
            name: website.siteName,
          })}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/websites/$websiteSlug/edit"
            params={{
              websiteSlug: website.slug,
            }}
            title={t("Edit {{name}}", {
              name: website.siteName,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: website.siteName,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/websites/$websiteSlug/info"
            params={{
              websiteSlug: website.slug,
            }}
            title={t("View {{name}}", {
              name: website.siteName,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: website.siteName,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      footer={website.category
        ? <CategoryPill category={website.category} />
        : undefined}
    />
  );
}
