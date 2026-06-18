import { z } from "zod";

import { useCreateWebsite } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";

import { RowCard } from "@/components/ui/card";

const addWebsiteSchema = z.object({
  domain: z.string().trim().min(1, "Domain is required"),
  siteName: z.string().trim(),
});

/** Inline "add a website" form — websites are normally auto-created, this adds one by hand. */
export function AddWebsiteForm() {
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
    <RowCard className="p-4">
      <form
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
    </RowCard>
  );
}
