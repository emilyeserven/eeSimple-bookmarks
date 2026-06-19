import type { Website } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe, MoreVertical, Sparkles } from "lucide-react";

import { CategoryPill } from "./CategoryPill";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { RowListItem } from "./RowListItem";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEntityImage } from "@/hooks/useEntityImage";
import { useAutoWebsiteFavicon } from "@/hooks/useWebsites";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A single row in the website listing: a favicon, a link to the view page, and a "More" menu. */
export function WebsiteListItem({
  website,
}: { website: Website }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const autoFavicon = useAutoWebsiteFavicon();
  const {
    showImage,
    onError,
  } = useEntityImage(website.imageUrl);

  return (
    <RowListItem
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
      badge={website.bookmarkCount}
      renderLink={(className, children) => (
        <Link
          to="/taxonomies/websites/$websiteSlug"
          params={{
            websiteSlug: website.slug,
          }}
          className={className}
          title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => viewClick(event, "website", website.id)}
        >
          {children}
        </Link>
      )}
      menu={(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`More options for ${website.siteName}`}
              className="
                shrink-0 opacity-0 transition-opacity
                group-hover:opacity-100
                focus-visible:opacity-100
                data-[state=open]:opacity-100
              "
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                to="/taxonomies/websites/$websiteSlug/edit"
                params={{
                  websiteSlug: website.slug,
                }}
                title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                onClick={event => editClick(event, "website", website.id)}
              >
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={autoFavicon.isPending || autoFavicon.cooldown.isOnCooldown}
              onClick={() => {
                if (!autoFavicon.cooldown.isOnCooldown) {
                  autoFavicon.mutate({
                    id: website.id,
                    sourceUrl: `https://${website.domain}/`,
                  });
                }
              }}
            >
              <Sparkles className="mr-2 size-4" />
              {autoFavicon.cooldown.isOnCooldown
                ? `Try again in ${autoFavicon.cooldown.remaining}s`
                : website.imageUrl
                  ? "Refresh favicon"
                  : "Get favicon"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      categoryPill={website.category
        ? <CategoryPill category={website.category} />
        : undefined}
    />
  );
}
