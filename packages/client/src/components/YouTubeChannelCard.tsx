import type { YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { MonitorPlay, Sparkles, Trash2 } from "lucide-react";

import { ChannelDetailsList } from "./ChannelDetailsList";
import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick } from "./panel/useEditPanelClick";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAutoYouTubeChannelImage, useDeleteYouTubeChannelImage } from "@/hooks/useYouTubeChannels";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Read-only display card for a single channel. Shared by the view page and the right panel's View body. */
export function YouTubeChannelCard({
  channel,
}: { channel: YouTubeChannel }) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = channel.imageUrl != null && !imageFailed;
  const autoAvatar = useAutoYouTubeChannelImage();
  const deleteAvatar = useDeleteYouTubeChannelImage();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span
              className="
                flex size-12 shrink-0 items-center justify-center
                overflow-hidden rounded-full bg-muted text-muted-foreground
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
                : <MonitorPlay className="size-6" />}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={autoAvatar.isPending || deleteAvatar.isPending}
                onClick={() => autoAvatar.mutate(channel.id, {
                  onSuccess: () => setImageFailed(false),
                })}
                title={channel.imageUrl ? "Refresh avatar" : "Fetch avatar"}
              >
                <Sparkles className="size-3" />
              </Button>
              {channel.imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={autoAvatar.isPending || deleteAvatar.isPending}
                  onClick={() => deleteAvatar.mutate(channel.id)}
                  title="Remove avatar"
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-semibold">{channel.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{channel.channelKey}</p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
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
        </Button>
      </div>

      <Separator />

      <LabeledSection title="Details">
        <ChannelDetailsList channel={channel} />
      </LabeledSection>
    </div>
  );
}
