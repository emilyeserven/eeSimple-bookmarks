import { ListingScaffold } from "./ListingScaffold";

import { groupListingConfig } from "@/entities/group";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable group listing. Shared by the Groups taxonomy page. */
export function GroupsListing() {
  const state = useListingScaffold(groupListingConfig);
  return (
    <ListingScaffold
      config={groupListingConfig}
      state={state}
    />
  );
}
