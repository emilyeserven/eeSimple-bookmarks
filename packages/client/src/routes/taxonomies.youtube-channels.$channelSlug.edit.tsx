import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit")({
  component: YouTubeChannelEditLayout,
});

function YouTubeChannelEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    channelSlug,
  } = Route.useParams();
  const {
    channel, isLoading,
  } = useYouTubeChannelBySlug(channelSlug);

  const editNav = [
    {
      to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
      label: t("General"),
    },
    {
      type: "group",
      label: t("Rules"),
      items: [
        {
          to: "/taxonomies/youtube-channels/$channelSlug/edit/autofill",
          label: t("Autofill Rules"),
        },
        {
          to: "/taxonomies/youtube-channels/$channelSlug/edit/display-rules",
          label: t("Display Rules"),
        },
      ],
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/youtube-channels/$channelSlug"
            params={{
              channelSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("channel") : (channel?.name ?? t("channel")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit channel")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        channelSlug,
      }}
      navAriaLabel={t("Channel edit sections")}
    />
  );
}
