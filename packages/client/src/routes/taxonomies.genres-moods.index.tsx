import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddGenreMoodModal } from "../components/AddGenreMoodModal";
import { GenreMoodsListing } from "../components/GenreMoodManager";
import { useGenreMoods } from "../hooks/useGenreMoods";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/genres-moods/")({
  component: GenreMoodsTaxonomyPage,
});

/** Browse view for the Genres & Moods taxonomy: every entry with search filtering. */
function GenreMoodsTaxonomyPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allGenreMoods,
  } = useGenreMoods();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("genre-moods-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New entry"),
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Genres & Moods")}</h1>
          {allGenreMoods
            ? (
              <Badge variant="secondary">
                {allGenreMoods.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Browse the Genres & Moods taxonomy — a single hierarchical vocabulary you can apply to bookmarks and any other taxonomy. Click an entry to view or edit it.")}
        </p>
      </div>

      <GenreMoodsListing />

      <AddGenreMoodModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(genreMood) => {
          void navigate({
            to: "/taxonomies/genres-moods/$genreMoodSlug/edit",
            params: {
              genreMoodSlug: genreMood.slug,
            },
          });
        }}
      />
    </section>
  );
}
