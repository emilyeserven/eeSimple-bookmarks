import type { Website } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CategoryPill } from "./CategoryPill";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

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
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage,
    onError,
  } = useEntityImage(website.imageUrl);

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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "website", website.id)}
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
            to="/taxonomies/websites/$websiteSlug/general"
            params={{
              websiteSlug: website.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "website", website.id, website.slug)}
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
