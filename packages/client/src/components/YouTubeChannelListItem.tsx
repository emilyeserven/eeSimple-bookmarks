import type { YouTubeChannel } from "@eesimple/types";

import { channelUrlFromKey } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { MonitorPlay, MoreVertical, Sparkles } from "lucide-react";

import { CategoryPill } from "./CategoryPill";
import { RowListItem } from "./RowListItem";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEntityImage } from "@/hooks/useEntityImage";
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
  const { showImage, onError } = useEntityImage(channel.imageUrl);

  return (
    <RowListItem
      icon={(
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
                onError={onError}
              />
            )
            : <MonitorPlay className="size-4" />}
        </span>
      )}
      title={channel.name}
      subtitle={channel.channelKey}
      badge={channel.bookmarkCount}
      linkProps={{
        to: "/taxonomies/youtube-channels/$channelSlug",
        params: {
          channelSlug: channel.slug,
        },
        title: `Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`,
        onClick: event => viewClick(event, "youtube-channel", channel.id),
      }}
      menu={(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`More options for ${channel.name}`}
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
            <DropdownMenuItem
              disabled={autoAvatar.isPending || autoAvatar.cooldown.isOnCooldown}
              onClick={() => {
                if (!autoAvatar.cooldown.isOnCooldown) {
                  autoAvatar.mutate({
                    id: channel.id,
                    sourceUrl: channelUrlFromKey(channel.channelKey),
                  });
                }
              }}
            >
              <Sparkles className="mr-2 size-4" />
              {autoAvatar.cooldown.isOnCooldown
                ? `Try again in ${autoAvatar.cooldown.remaining}s`
                : channel.imageUrl
                  ? "Refresh avatar"
                  : "Get avatar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      categoryPill={channel.category
        ? <CategoryPill category={channel.category} />
        : undefined}
    />
  );
}
