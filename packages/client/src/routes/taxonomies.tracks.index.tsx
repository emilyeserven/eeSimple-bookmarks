import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddTrackModal } from "../components/AddTrackModal";
import { TracksListing } from "../components/TrackManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { useTracks } from "../hooks/useTracks";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/tracks/")({
  component: TracksPage,
});

/** Browse view for Tracks: every track with search filtering. */
function TracksPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allTracks,
  } = useTracks();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("tracks-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New track"),
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Tracks")}</h1>
          {allTracks
            ? (
              <Badge variant="secondary">
                {allTracks.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Individual tracks, optionally grouped under a media property and linked to a Plex item. Bookmarks link to a track here. Click one to view or edit it.")}
        </p>
      </div>

      <TracksListing />

      <AddTrackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(track) => {
          void navigate({
            to: "/taxonomies/tracks/$trackSlug/edit/general",
            params: {
              trackSlug: track.slug,
            },
          });
        }}
      />
    </section>
  );
}
