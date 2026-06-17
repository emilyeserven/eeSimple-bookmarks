import { Link, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { WebsiteManager } from "../components/WebsiteManager";
import { useCreateWebsite } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/websites")({
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

/** Browse view for the Websites taxonomy: every known site, plus links to add one and to Settings. */
function WebsitesTaxonomyPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Websites</h1>
          <p className="text-sm text-muted-foreground">
            Browse the Websites taxonomy. Add a site below, or open Settings to rename existing ones.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to="/settings/websites">Settings</Link>
        </Button>
      </div>

      <AddWebsiteForm />
      <WebsiteManager />
    </section>
  );
}
