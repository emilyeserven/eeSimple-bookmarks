import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddAuthorModal } from "./AddAuthorModal";
import { ListingScaffold } from "./ListingScaffold";

import { authorListingConfig } from "@/entities/author";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable author listing with an inline add modal. */
export function AuthorsListing() {
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("authors-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New author",
  });
  const navigate = useNavigate();
  const state = useListingScaffold(authorListingConfig);

  return (
    <>
      <ListingScaffold
        config={authorListingConfig}
        state={state}
      />

      <AddAuthorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(author) => {
          void navigate({
            to: "/taxonomies/authors/$authorSlug/edit/general",
            params: {
              authorSlug: author.slug,
            },
          });
        }}
      />
    </>
  );
}
