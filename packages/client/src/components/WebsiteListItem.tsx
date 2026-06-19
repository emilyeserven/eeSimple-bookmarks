import type { Website } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Globe, MoreVertical, Sparkles } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  // Hide a favicon that 404s/fails to decode so the fallback icon shows instead.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = website.imageUrl != null && !imageFailed;
  return (
    <RowCard className="group relative">
      <Link
        to="/taxonomies/websites/$websiteSlug"
        params={{
          websiteSlug: website.slug,
        }}
        title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={event => viewClick(event, "website", website.id)}
        className="
          flex items-center gap-3 rounded-lg p-4 pr-12 transition-colors
          hover:bg-accent
        "
      >
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
                onError={() => setImageFailed(true)}
              />
            )
            : <Globe className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{website.siteName}</p>
          <p className="truncate text-sm text-muted-foreground">{website.domain}</p>
        </div>
        {website.bookmarkCount !== undefined
          ? <Badge variant="secondary">{website.bookmarkCount}</Badge>
          : null}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`More options for ${website.siteName}`}
            className="
              absolute top-1/2 right-2 -translate-y-1/2 opacity-0
              transition-opacity
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
              if (!autoFavicon.cooldown.isOnCooldown) autoFavicon.mutate(website.id);
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
    </RowCard>
  );
}
