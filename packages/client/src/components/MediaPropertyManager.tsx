import { ListingScaffold } from "./ListingScaffold";

import { mediaPropertyListingConfig } from "@/entities/mediaProperty";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable media-property listing. */
export function MediaPropertiesListing() {
  // The route (taxonomies.media-properties.index) owns the useSetListingPage registration — a second
  // bare call here would clobber its create-button affordances.
  const state = useListingScaffold(mediaPropertyListingConfig);
  return (
    <ListingScaffold
      config={mediaPropertyListingConfig}
      state={state}
    />
  );
}
