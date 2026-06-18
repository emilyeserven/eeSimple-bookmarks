import { useState } from "react";

import { AddWebsiteForm } from "./AddWebsiteForm";
import { WebsiteListItem } from "./WebsiteListItem";
import { useWebsites } from "../hooks/useWebsites";

import { Input } from "@/components/ui/input";

/** Browsable, searchable website listing with add form. Shared by the Websites taxonomy page and the Settings Websites page. */
export function WebsitesListing() {
  const {
    data: allWebsites, isLoading, error,
  } = useWebsites();
  const [search, setSearch] = useState("");

  const filtered = (allWebsites ?? []).filter((w) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return w.siteName.toLowerCase().includes(q) || w.domain.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <AddWebsiteForm />

      <div className="space-y-4">
        <Input
          placeholder="Search by name or domain…"
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="max-w-sm"
        />

        {isLoading ? <p className="text-muted-foreground">Loading websites…</p> : null}
        {error ? <p className="text-destructive">{error.message}</p> : null}
        {!isLoading && (allWebsites?.length ?? 0) === 0
          ? (
            <p className="text-muted-foreground">
              No websites yet. They&apos;re created automatically when you add bookmarks.
            </p>
          )
          : null}
        {!isLoading && (allWebsites?.length ?? 0) > 0 && filtered.length === 0
          ? (
            <p className="text-muted-foreground">
              No websites match &ldquo;{search}&rdquo;.
            </p>
          )
          : null}

        {filtered.length > 0
          ? (
            <ul className="space-y-2">
              {filtered.map(website => (
                <li key={website.id}>
                  <WebsiteListItem website={website} />
                </li>
              ))}
            </ul>
          )
          : null}
      </div>
    </div>
  );
}
