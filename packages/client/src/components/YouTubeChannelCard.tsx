import type { YouTubeChannel } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { ChannelDetailsList } from "./ChannelDetailsList";
import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick } from "./panel/useEditPanelClick";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Read-only display card for a single channel. Shared by the view page and the right panel's View body. */
export function YouTubeChannelCard({
  channel,
}: { channel: YouTubeChannel }) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold">{channel.name}</h2>
          <p className="truncate text-sm text-muted-foreground">{channel.channelKey}</p>
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
