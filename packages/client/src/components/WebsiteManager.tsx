import type { Website } from "@eesimple/types";

import { useState } from "react";

import { useUpdateWebsite, useWebsites } from "../hooks/useWebsites";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** A single editable website row: rename the site name and/or fix up its domain. */
export function WebsiteRow({
  website,
}: { website: Website }) {
  const updateWebsite = useUpdateWebsite();
  const [siteName, setSiteName] = useState(website.siteName);
  const [domain, setDomain] = useState(website.domain);

  const dirty = siteName.trim() !== website.siteName || domain.trim() !== website.domain;
  const valid = siteName.trim().length > 0 && domain.trim().length > 0;

  function save(): void {
    if (!dirty || !valid) return;
    updateWebsite.mutate({
      id: website.id,
      input: {
        siteName: siteName.trim(),
        domain: domain.trim(),
      },
    });
  }

  return (
    <div>
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_1fr_auto] sm:items-end
        "
      >
        <div className="space-y-1">
          <Label htmlFor={`site-name-${website.id}`}>Site name</Label>
          <Input
            id={`site-name-${website.id}`}
            value={siteName}
            onChange={event => setSiteName(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`site-domain-${website.id}`}>Domain</Label>
          <Input
            id={`site-domain-${website.id}`}
            value={domain}
            onChange={event => setDomain(event.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!dirty || !valid || updateWebsite.isPending}
          onClick={save}
        >
          {updateWebsite.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      {updateWebsite.isError
        ? <p className="mt-2 text-sm text-destructive">{updateWebsite.error.message}</p>
        : null}
    </div>
  );
}

/** Manage the built-in Websites taxonomy: list every known site and rename it. */
export function WebsiteManager() {
  const {
    data: websites, isLoading, error,
  } = useWebsites();

  return (
    <section className="space-y-4">
      {isLoading ? <p className="text-muted-foreground">Loading websites…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && websites && websites.length === 0
        ? (
          <p className="text-muted-foreground">
            No websites yet. They’re created automatically when you add bookmarks.
          </p>
        )
        : null}

      {websites && websites.length > 0
        ? (
          <ul className="space-y-3">
            {websites.map(website => (
              <li
                key={website.id}
                className="rounded-lg border bg-card p-4"
              >
                <WebsiteRow website={website} />
              </li>
            ))}
          </ul>
        )
        : null}
    </section>
  );
}
