import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddAlbumModal } from "../components/AddAlbumModal";
import { AlbumsListing } from "../components/AlbumManager";
import { useAlbums } from "../hooks/useAlbums";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/albums/")({
  component: AlbumsPage,
});

/** Browse view for Albums: every album with search filtering. */
function AlbumsPage() {
  const {
    data: allAlbums,
  } = useAlbums();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("albums-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New album",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Albums</h1>
          {allAlbums
            ? (
              <Badge variant="secondary">
                {allAlbums.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Individual albums, optionally grouped under a media property and linked to a Plex item.
          Bookmarks link to an album here. Click one to view or edit it.
        </p>
      </div>

      <AlbumsListing />

      <AddAlbumModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(album) => {
          void navigate({
            to: "/taxonomies/albums/$albumSlug/edit/general",
            params: {
              albumSlug: album.slug,
            },
          });
        }}
      />
    </section>
  );
}
