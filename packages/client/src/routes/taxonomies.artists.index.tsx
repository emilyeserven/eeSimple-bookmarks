import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddArtistModal } from "../components/AddArtistModal";
import { ArtistsListing } from "../components/ArtistManager";
import { useArtists } from "../hooks/useArtists";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/artists/")({
  component: ArtistsPage,
});

/** Browse view for Artists: every artist with search filtering. */
function ArtistsPage() {
  const {
    data: allArtists,
  } = useArtists();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("artists-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New artist",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Artists</h1>
          {allArtists
            ? (
              <Badge variant="secondary">
                {allArtists.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Individual music artists, optionally grouped under a media property and linked to a Plex item.
          Bookmarks link to an artist here. Click one to view or edit it.
        </p>
      </div>

      <ArtistsListing />

      <AddArtistModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(artist) => {
          void navigate({
            to: "/taxonomies/artists/$artistSlug/edit/general",
            params: {
              artistSlug: artist.slug,
            },
          });
        }}
      />
    </section>
  );
}
