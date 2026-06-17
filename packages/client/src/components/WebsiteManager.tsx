import type { Website } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { useUpdateWebsite, useWebsites } from "../hooks/useWebsites";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** A single editable website row: rename the site name and/or fix up its domain. */
export function WebsiteRow({
  website,
  onSaved,
}: { website: Website;
  onSaved?: () => void; }) {
  const updateWebsite = useUpdateWebsite();
  const [siteName, setSiteName] = useState(website.siteName);
  const [domain, setDomain] = useState(website.domain);

  const dirty = siteName.trim() !== website.siteName || domain.trim() !== website.domain;
  const valid = siteName.trim().length > 0 && domain.trim().length > 0;

  function save(): void {
    if (!dirty || !valid) return;
    updateWebsite.mutate(
      {
        id: website.id,
        input: {
          siteName: siteName.trim(),
          domain: domain.trim(),
        },
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
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

/** Read-only display card for a single website. Shared by the view page and the right panel's View body. */
export function WebsiteCard({
  website,
}: { website: Website }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold">{website.siteName}</h2>
          <a
            href={`https://${website.domain}`}
            target="_blank"
            rel="noreferrer"
            className="
              inline-flex items-center gap-1 text-sm text-muted-foreground
              hover:text-foreground hover:underline
            "
          >
            {website.domain}
            <ExternalLink className="size-3" />
          </a>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/taxonomies/websites/$websiteSlug/edit"
            params={{
              websiteSlug: website.slug,
            }}
          >
            Edit
          </Link>
        </Button>
      </div>
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(website.createdAt).toLocaleDateString()}</dd>
      </dl>
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
            No websites yet. They&apos;re created automatically when you add bookmarks.
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
