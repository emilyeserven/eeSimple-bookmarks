import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddCustomPropertyModal } from "./AddCustomPropertyModal";
import { ListingScaffold } from "./ListingScaffold";

import { customPropertyListingConfig } from "@/entities/property";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Searchable listing of custom properties, with previews that link out to the view/create pages. */
export function CustomPropertyManager() {
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("custom-properties-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New property",
  });
  const navigate = useNavigate();
  const state = useListingScaffold(customPropertyListingConfig);

  return (
    <section className="space-y-4">
      <ListingScaffold
        config={customPropertyListingConfig}
        state={state}
      />

      <AddCustomPropertyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(property) => {
          void navigate({
            to: "/custom-properties/$propertySlug/edit/general",
            params: {
              propertySlug: property.slug,
            },
          });
        }}
      />
    </section>
  );
}
