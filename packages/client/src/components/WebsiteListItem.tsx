import type { Website } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe, Info, Pencil } from "lucide-react";

import { CategoryPill } from "./CategoryPill";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
import { withWebsites } from "@/lib/bookmarkSearch";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

/** A single row in the website listing: a favicon, a body link to the filtered bookmarks, and hover Edit / Info. */
export function WebsiteListItem({
  website,
}: { website: Website }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage,
    onError,
  } = useEntityImage(website.imageUrl);

  return (
    <StandardListingCard
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
          to="/bookmarks"
          search={withWebsites({}, [website.id])}
          title={`Show bookmarks from ${website.siteName}`}
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
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "website", website.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {website.siteName}</span>
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
            title={`Info (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => viewClick(event, "website", website.id)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {website.siteName}</span>
          </Link>
        </HoverIconButton>
      )}
      footer={website.category
        ? <CategoryPill category={website.category} />
        : undefined}
    />
  );
}
