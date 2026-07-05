import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";
import i18n from "../i18n";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view")({
  component: YouTubeChannelViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/youtube-channels/$channelSlug/general",
    label: i18n.t("General"),
  },
  {
    type: "group",
    label: i18n.t("Rules"),
    items: [
      {
        to: "/taxonomies/youtube-channels/$channelSlug/autofill",
        label: i18n.t("Autofill Rules"),
      },
      {
        to: "/taxonomies/youtube-channels/$channelSlug/display-rules",
        label: i18n.t("Display Rules"),
      },
    ],
  },
] as const;

function YouTubeChannelViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    channelSlug,
  } = Route.useParams();
  const {
    channel, isLoading,
  } = useYouTubeChannelBySlug(channelSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "url",
            url: channel?.imageUrl ?? null,
          }}
          title={isLoading ? t("Channel") : (channel?.name ?? t("Channel not found"))}
          subtitle={channel?.channelKey}
        />
      )}
      nav={viewNav}
      params={{
        channelSlug,
      }}
      navAriaLabel={t("Channel sections")}
    />
  );
}
