import { useMemo } from "react";

import { ListingScaffold } from "./ListingScaffold";

import { buildLocationRelationListingConfig } from "@/entities/locationRelation";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/**
 * Browsable, searchable location-relation listing. Creation / merge / reassign lives in
 * Settings → Locations → Location Relations.
 */
export function LocationRelationsListing() {
  useSetListingPage("location-relations-listing", {
    addBookmark: {},
  });

  const listingConfig = useMemo(() => buildLocationRelationListingConfig(), []);
  const state = useListingScaffold(listingConfig);

  return (
    <ListingScaffold
      config={listingConfig}
      state={state}
    />
  );
}
