import { Link, createFileRoute } from "@tanstack/react-router";

import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { YouTubeChannelRow } from "../components/YouTubeChannelManager";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit")({
  component: YouTubeChannelEditPage,
});

function YouTubeChannelEditPage() {
  const {
    channelSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    channel, isLoading, error,
  } = useYouTubeChannelBySlug(channelSlug);

  return (
    <TaxonomyDetailLayout
      isLoading={isLoading}
      error={error}
      entity={channel}
      loadingLabel="Loading channel…"
      notFoundMessage="Channel not found."
      listHref="/taxonomies/youtube-channels"
      listLabel="Back to channels"
    >
      {ch => (
        <section className="space-y-6">
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
              ← Back to {ch.name}
            </Link>
            <h1 className="text-2xl font-bold">Edit channel</h1>
          </div>
          <YouTubeChannelRow
            channel={ch}
            onSaved={() => navigate({
              to: "/taxonomies/youtube-channels",
            })}
          />
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
