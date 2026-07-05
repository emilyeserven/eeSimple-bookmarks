import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { YouTubeChannelsListing } from "../components/YouTubeChannelManager";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/youtube-channels/")({
  component: YouTubeChannelsTaxonomyPage,
});

/** Browse view for the YouTube Channels taxonomy: every known channel with search filtering. */
function YouTubeChannelsTaxonomyPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allChannels,
  } = useYouTubeChannels();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("YouTube Channels")}</h1>
          {allChannels
            ? (
              <Badge variant="secondary">
                {allChannels.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            "Browse the YouTube Channels taxonomy. Channels are created automatically when you add YouTube bookmarks. Click a channel to view or edit it.",
          )}
        </p>
      </div>

      <YouTubeChannelsListing />
    </section>
  );
}
