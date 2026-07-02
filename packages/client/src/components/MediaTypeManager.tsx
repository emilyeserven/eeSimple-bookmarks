import { TreeListingScaffold } from "./TreeListingScaffold";

import { mediaTypeTreeListingConfig } from "@/entities/mediaType";
import { useTreeListingScaffold } from "@/hooks/useTreeListingScaffold";

/** Browsable, collapsible media-type taxonomy tree. Shared by the Media Types taxonomy page and the Settings page. */
export function MediaTypesListing() {
  const state = useTreeListingScaffold(mediaTypeTreeListingConfig);

  return (
    <TreeListingScaffold
      config={mediaTypeTreeListingConfig}
      state={state}
    />
  );
}
