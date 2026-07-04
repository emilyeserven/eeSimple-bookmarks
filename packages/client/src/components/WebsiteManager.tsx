import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddWebsiteModal } from "./AddWebsiteModal";
import { ListingScaffold } from "./ListingScaffold";

import { websiteListingConfig } from "@/entities/website";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable website listing with add modal. Shared by the Websites taxonomy page and the Settings Websites page. */
export function WebsitesListing() {
  const {
    t,
  } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("websites-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New website"),
  });
  const navigate = useNavigate();
  const state = useListingScaffold(websiteListingConfig);

  return (
    <div className="space-y-4">
      <ListingScaffold
        config={websiteListingConfig}
        state={state}
      />

      <AddWebsiteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(website) => {
          void navigate({
            to: "/taxonomies/websites/$websiteSlug/edit/general",
            params: {
              websiteSlug: website.slug,
            },
          });
        }}
      />
    </div>
  );
}
