import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddTvShowModal } from "../components/AddTvShowModal";
import { TvShowsListing } from "../components/TvShowManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { useTvShows } from "../hooks/useTvShows";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/tv-shows/")({
  component: TvShowsPage,
});

/** Browse view for TV Shows: every show with search filtering. */
function TvShowsPage() {
  const {
    data: allTvShows,
  } = useTvShows();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("tv-shows-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New TV show",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">TV Shows</h1>
          {allTvShows
            ? (
              <Badge variant="secondary">
                {allTvShows.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          TV shows, optionally grouped under a media property and linked to a Plex item. Bookmarks
          link to a show here. Click one to view or edit it.
        </p>
      </div>

      <TvShowsListing />

      <AddTvShowModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(show) => {
          void navigate({
            to: "/taxonomies/tv-shows/$tvShowSlug/edit/general",
            params: {
              tvShowSlug: show.slug,
            },
          });
        }}
      />
    </section>
  );
}
