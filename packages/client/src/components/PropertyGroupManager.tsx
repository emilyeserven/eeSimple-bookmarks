import { useState } from "react";

import { AddPropertyGroupForm } from "./AddPropertyGroupForm";
import { PropertyGroupListItem } from "./PropertyGroupListItem";
import { usePropertyGroups } from "../hooks/usePropertyGroups";

import { Input } from "@/components/ui/input";

/** Browsable, searchable property-group listing with add form. */
export function PropertyGroupsListing() {
  const {
    data: allGroups, isLoading, error,
  } = usePropertyGroups();
  const [search, setSearch] = useState("");

  const filtered = (allGroups ?? []).filter((g) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <AddPropertyGroupForm />

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
              No property groups yet. Add one above.
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
            <ul className="space-y-2">
              {filtered.map(group => (
                <PropertyGroupListItem
                  key={group.id}
                  group={group}
                />
              ))}
            </ul>
          )
          : null}
      </div>
    </div>
  );
}
