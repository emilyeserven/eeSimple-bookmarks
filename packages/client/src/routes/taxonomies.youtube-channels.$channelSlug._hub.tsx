import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

/**
 * The channel listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_hub")({
  component: YouTubeChannelHubLayout,
});

function YouTubeChannelHubLayout() {
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
    <ListingHubLayout
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
      tabs={[
        {
          to: "/taxonomies/youtube-channels/$channelSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/youtube-channels/$channelSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/youtube-channels/$channelSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        channelSlug,
      }}
      navAriaLabel={t("Channel views")}
    />
  );
}
