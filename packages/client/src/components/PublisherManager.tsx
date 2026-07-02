import { ListingScaffold } from "./ListingScaffold";

import { publisherListingConfig } from "@/entities/publisher";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable publisher listing. Shared by the Publishers taxonomy page. */
export function PublishersListing() {
  const state = useListingScaffold(publisherListingConfig);
  return (
    <ListingScaffold
      config={publisherListingConfig}
      state={state}
    />
  );
}
