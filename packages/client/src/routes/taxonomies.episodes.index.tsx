import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddEpisodeModal } from "../components/AddEpisodeModal";
import { EpisodesListing } from "../components/EpisodeManager";
import { useEpisodes } from "../hooks/useEpisodes";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/episodes/")({
  component: EpisodesPage,
});

/** Browse view for Episodes: every episode with search filtering. */
function EpisodesPage() {
  const {
    data: allEpisodes,
  } = useEpisodes();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("episodes-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New episode",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Episodes</h1>
          {allEpisodes
            ? (
              <Badge variant="secondary">
                {allEpisodes.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Individual episodes, optionally grouped under a media property and linked to a Plex item.
          Bookmarks link to an episode here. Click one to view or edit it.
        </p>
      </div>

      <EpisodesListing />

      <AddEpisodeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(episode) => {
          void navigate({
            to: "/taxonomies/episodes/$episodeSlug/edit/general",
            params: {
              episodeSlug: episode.slug,
            },
          });
        }}
      />
    </section>
  );
}
