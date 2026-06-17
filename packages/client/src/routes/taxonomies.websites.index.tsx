import { useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { z } from "zod";

import { useCreateWebsite, useWebsites } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/taxonomies/websites/")({
  component: WebsitesTaxonomyPage,
});

const addWebsiteSchema = z.object({
  domain: z.string().trim().min(1, "Domain is required"),
  siteName: z.string().trim(),
});

/** Inline "add a website" form — websites are normally auto-created, this adds one by hand. */
function AddWebsiteForm() {
  const createWebsite = useCreateWebsite();

  const form = useAppForm({
    defaultValues: {
      domain: "",
      siteName: "",
    },
    validators: {
      onChange: addWebsiteSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createWebsite.mutate(
        {
          domain: value.domain.trim(),
          siteName: value.siteName.trim() || undefined,
        },
        {
          onSuccess: () => form.reset(),
        },
      );
    },
  });

  return (
    <form
      className="rounded-lg border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_1fr_auto] sm:items-end
        "
      >
        <form.AppField name="domain">
          {field => (
            <field.TextField
              label="Domain"
              placeholder="example.com"
            />
          )}
        </form.AppField>
        <form.AppField name="siteName">
          {field => (
            <field.TextField
              label="Site name (optional)"
              placeholder="Defaults to the domain"
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton
            label="Add website"
            pendingLabel="Adding…"
          />
        </form.AppForm>
      </div>
      {createWebsite.isError
        ? <p className="mt-2 text-sm text-destructive">{createWebsite.error.message}</p>
        : null}
    </form>
  );
}

/** Browse view for the Websites taxonomy: every known site with search filtering. */
function WebsitesTaxonomyPage() {
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
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Websites</h1>
          {allWebsites
            ? (
              <Badge variant="secondary">
                {allWebsites.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Websites taxonomy. Sites are created automatically when you add bookmarks. Click
          a site to view or edit it.
        </p>
      </div>

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
                <li
                  key={website.id}
                  className="group relative rounded-lg border bg-card"
                >
                  <Link
                    to="/taxonomies/websites/$websiteSlug"
                    params={{
                      websiteSlug: website.slug,
                    }}
                    className="
                      flex items-center gap-3 rounded-lg p-4 pr-12
                      transition-colors
                      hover:bg-accent
                    "
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{website.siteName}</p>
                      <p className="truncate text-sm text-muted-foreground">{website.domain}</p>
                    </div>
                    {website.bookmarkCount !== undefined
                      ? <Badge variant="secondary">{website.bookmarkCount}</Badge>
                      : null}
                  </Link>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="
                      absolute top-1/2 right-2 -translate-y-1/2 opacity-0
                      transition-opacity
                      group-hover:opacity-100
                      focus-visible:opacity-100
                    "
                  >
                    <Link
                      to="/taxonomies/websites/$websiteSlug/edit"
                      params={{
                        websiteSlug: website.slug,
                      }}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit {website.siteName}</span>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )
          : null}
      </div>
    </section>
  );
}
