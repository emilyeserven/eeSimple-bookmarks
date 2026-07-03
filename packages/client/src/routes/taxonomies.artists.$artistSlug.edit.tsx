import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useArtistBySlug } from "../hooks/useArtists";

export const Route = createFileRoute("/taxonomies/artists/$artistSlug/edit")({
  component: ArtistEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/artists/$artistSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/artists/$artistSlug/edit/image",
    label: "Image",
  },
] as const;

function ArtistEditLayout() {
  const {
    artistSlug,
  } = Route.useParams();
  const {
    artist, isLoading,
  } = useArtistBySlug(artistSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/artists/$artistSlug"
            params={{
              artistSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "artist" : (artist?.name ?? "artist")}
          </Link>
          <h1 className="text-2xl font-bold">Edit artist</h1>
        </div>
      )}
      nav={editNav}
      params={{
        artistSlug,
      }}
      navAriaLabel="Artist edit sections"
    />
  );
}
