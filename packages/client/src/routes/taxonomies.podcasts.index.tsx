import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddPodcastModal } from "../components/AddPodcastModal";
import { PodcastsListing } from "../components/PodcastManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { usePodcasts } from "../hooks/usePodcasts";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/podcasts/")({
  component: PodcastsPage,
});

/** Browse view for Podcasts: every podcast with search filtering. */
function PodcastsPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allPodcasts,
  } = usePodcasts();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("podcasts-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New podcast"),
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Podcasts")}</h1>
          {allPodcasts
            ? (
              <Badge variant="secondary">
                {allPodcasts.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Individual podcasts, optionally grouped under a media property and synced from their RSS feed. Bookmarks link to a podcast here. Click one to view or edit it.")}
        </p>
      </div>

      <PodcastsListing />

      <AddPodcastModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(podcast) => {
          void navigate({
            to: "/taxonomies/podcasts/$podcastSlug/edit/general",
            params: {
              podcastSlug: podcast.slug,
            },
          });
        }}
      />
    </section>
  );
}
