import { TreeListingScaffold } from "./TreeListingScaffold";

import { genreMoodTreeListingConfig } from "@/entities/genreMood";
import { useTreeListingScaffold } from "@/hooks/useTreeListingScaffold";

/** Browsable, collapsible Genres & Moods taxonomy tree. Shared by the taxonomy page and Settings. */
export function GenreMoodsListing() {
  const state = useTreeListingScaffold(genreMoodTreeListingConfig);

  return (
    <TreeListingScaffold
      config={genreMoodTreeListingConfig}
      state={state}
    />
  );
}
