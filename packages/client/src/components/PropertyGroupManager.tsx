import { PropertyGroupListItem } from "./PropertyGroupListItem";
import { useSetListingPage } from "../hooks/useListingPage";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

import { useUiStore } from "@/stores/uiStore";

/** Browsable, searchable property-group listing. */
export function PropertyGroupsListing() {
  const {
    data: allGroups, isLoading, error,
  } = usePropertyGroups();
  useSetListingPage("property-groups-listing");
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("property-groups-listing");

  const rawQuery = useUiStore(state => state.headerSearchQuery);
  const filtered = (allGroups ?? []).filter((g) => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    return g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {isLoading ? <p className="text-muted-foreground">Loading property groups…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (allGroups?.length ?? 0) === 0
        ? (
          <p className="text-muted-foreground">
            No property groups yet.
          </p>
        )
        : null}
      {!isLoading && (allGroups?.length ?? 0) > 0 && filtered.length === 0
        ? (
          <p className="text-muted-foreground">
            No property groups match &ldquo;{rawQuery}&rdquo;.
          </p>
        )
        : null}

      {filtered.length > 0
        ? (
          <div
            className={`
              grid gap-2
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(group => (
              <PropertyGroupListItem
                key={group.id}
                group={group}
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
