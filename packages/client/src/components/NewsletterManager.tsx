import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddNewsletterModal } from "./AddNewsletterModal";
import { ListingScaffold } from "./ListingScaffold";

import { newsletterListingConfig } from "@/entities/newsletter";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable newsletter listing with an inline add modal. */
export function NewslettersListing() {
  const {
    t,
  } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("newsletters-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New newsletter"),
  });
  const navigate = useNavigate();
  const state = useListingScaffold(newsletterListingConfig);

  return (
    <>
      <ListingScaffold
        config={newsletterListingConfig}
        state={state}
      />

      <AddNewsletterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(newsletter) => {
          void navigate({
            to: "/taxonomies/newsletters/$newsletterSlug/edit",
            params: {
              newsletterSlug: newsletter.slug,
            },
          });
        }}
      />
    </>
  );
}
