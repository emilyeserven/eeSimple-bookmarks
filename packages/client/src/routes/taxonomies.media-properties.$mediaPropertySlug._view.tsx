import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMediaPropertyBySlug } from "../hooks/useMediaProperties";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/_view")({
  component: MediaPropertyViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/media-properties/$mediaPropertySlug/general",
    label: "General",
  },
] as const;

function MediaPropertyViewLayout() {
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const {
    mediaProperty, isLoading,
  } = useMediaPropertyBySlug(mediaPropertySlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? "Media property" : (mediaProperty?.name ?? "Media property not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        mediaPropertySlug,
      }}
      navAriaLabel="Media property sections"
    />
  );
}
