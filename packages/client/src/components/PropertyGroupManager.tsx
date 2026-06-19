import { useState } from "react";

import { PropertyGroupListItem } from "./PropertyGroupListItem";
import { useSetListingPage } from "../hooks/useListingPage";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

import { Input } from "@/components/ui/input";

/** Browsable, searchable property-group listing. */
export function PropertyGroupsListing() {
  const {
    data: allGroups, isLoading, error,
  } = usePropertyGroups();
  const [search, setSearch] = useState("");
  useSetListingPage("property-groups-listing");
  const columns = useBookmarkColumns("property-groups-listing");

  const filtered = (allGroups ?? []).filter((g) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name…"
        value={search}
        onChange={event => setSearch(event.target.value)}
        className="max-w-sm"
      />

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
            No property groups match &ldquo;{search}&rdquo;.
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
