import type { YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { MonitorPlay, MoreVertical, Sparkles } from "lucide-react";

import { CategoryPill } from "./CategoryPill";
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
import { useAutoYouTubeChannelImage } from "@/hooks/useYouTubeChannels";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A single row in the channel listing: an avatar, a link to the view page, and a "More" menu. */
export function YouTubeChannelListItem({
  channel,
}: { channel: YouTubeChannel }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const autoAvatar = useAutoYouTubeChannelImage();
  // Hide an avatar that 404s/fails to decode so the fallback icon shows instead.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = channel.imageUrl != null && !imageFailed;
  return (
    <RowCard
      className="
        group relative transition-colors
        hover:bg-accent
      "
    >
      <Link
        to="/taxonomies/youtube-channels/$channelSlug/general"
        params={{
          channelSlug: channel.slug,
        }}
        title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={event => viewClick(event, "youtube-channel", channel.id)}
        className="flex items-center gap-3 p-4 pr-12"
      >
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-full bg-muted text-muted-foreground
          "
        >
          {showImage
            ? (
              <img
                src={channel.imageUrl ?? undefined}
                alt=""
                className="size-full object-cover"
                onError={() => setImageFailed(true)}
              />
            )
            : <MonitorPlay className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{channel.name}</p>
          <p className="truncate text-sm text-muted-foreground">{channel.channelKey}</p>
        </div>
        {channel.bookmarkCount !== undefined
          ? <Badge variant="secondary">{channel.bookmarkCount}</Badge>
          : null}
      </Link>
      {channel.category
        ? (
          <div className="px-4 pb-2 pl-15">
            <CategoryPill category={channel.category} />
          </div>
        )
        : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`More options for ${channel.name}`}
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
              to="/taxonomies/youtube-channels/$channelSlug/edit"
              params={{
                channelSlug: channel.slug,
              }}
              title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
              onClick={event => editClick(event, "youtube-channel", channel.id)}
            >
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              to="/taxonomies/youtube-channels/$channelSlug"
              params={{
                channelSlug: channel.slug,
              }}
            >
              See Bookmarks
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={autoAvatar.isPending}
            onClick={() => autoAvatar.mutate(channel.id)}
          >
            <Sparkles className="mr-2 size-4" />
            {channel.imageUrl ? "Refresh avatar" : "Get avatar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </RowCard>
  );
}
