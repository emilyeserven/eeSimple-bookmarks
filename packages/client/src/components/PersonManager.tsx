import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddPersonModal } from "./AddPersonModal";
import { ListingScaffold } from "./ListingScaffold";

import { personListingConfig } from "@/entities/person";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable person listing with an inline add modal. */
export function PeopleListing() {
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("people-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New person",
  });
  const navigate = useNavigate();
  const state = useListingScaffold(personListingConfig);

  return (
    <>
      <ListingScaffold
        config={personListingConfig}
        state={state}
      />

      <AddPersonModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(person) => {
          void navigate({
            to: "/taxonomies/people/$personSlug/edit/general",
            params: {
              personSlug: person.slug,
            },
          });
        }}
      />
    </>
  );
}
