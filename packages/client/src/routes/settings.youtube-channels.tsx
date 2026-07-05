import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { YouTubeChannelsListing } from "../components/YouTubeChannelManager";

export const Route = createFileRoute("/settings/youtube-channels")({
  component: YouTubeChannelsPage,
});

function YouTubeChannelsPage() {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("YouTube Channels")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "The built-in YouTube Channels taxonomy. Each channel is created automatically when you add a YouTube bookmark; rename a channel here to give it a friendly name.",
          )}
        </p>
      </div>
      <YouTubeChannelsListing />
    </section>
  );
}
