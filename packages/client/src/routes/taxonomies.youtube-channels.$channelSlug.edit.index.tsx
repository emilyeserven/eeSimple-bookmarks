import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { youtubeChannelWorkbench } from "../components/workbench/youtubeChannel";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: YouTubeChannelEditPage,
});

function YouTubeChannelEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    channelSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    channel, isLoading,
  } = useYouTubeChannelBySlug(channelSlug);

  return (
    <EntityEditView
      workbench={youtubeChannelWorkbench}
      slug={channelSlug}
      editTo="/taxonomies/youtube-channels/$channelSlug/edit"
      params={{
        channelSlug,
      }}
      activeTab={tab}
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
    />
  );
}
