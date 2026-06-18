import type { Website } from "@eesimple/types";

import { z } from "zod";

import { useUpdateWebsite } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";

const websiteGeneralSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required"),
  domain: z.string().trim().min(1, "Domain is required"),
});

interface Props {
  website: Website;
}

/** Edit a website's site name and domain. */
export function WebsiteGeneralForm({
  website,
}: Props) {
  const updateWebsite = useUpdateWebsite();

  const form = useAppForm({
    defaultValues: {
      siteName: website.siteName,
      domain: website.domain,
    },
    validators: {
      onChange: websiteGeneralSchema,
    },
    onSubmit: ({
      value,
    }) => {
      if (website.builtIn) return;
      updateWebsite.mutate({
        id: website.id,
        input: {
          siteName: value.siteName.trim(),
          domain: value.domain.trim(),
        },
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {website.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            Built-in site — its name and domain are fixed.
          </p>
        )
        : null}

      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <form.AppField name="siteName">
          {field => (
            <field.TextField
              label="Site name"
              disabled={website.builtIn}
            />
          )}
        </form.AppField>
        <form.AppField name="domain">
          {field => (
            <field.TextField
              label="Domain"
              disabled={website.builtIn}
            />
          )}
        </form.AppField>
      </div>

      {!website.builtIn
        ? (
          <form.AppForm>
            <form.Subscribe selector={state => state.values}>
              {(values) => {
                const dirty
                  = values.siteName.trim() !== website.siteName
                    || values.domain.trim() !== website.domain;
                return (
                  <form.SubmitButton
                    label="Save changes"
                    size="sm"
                    disabledWhen={!dirty}
                  />
                );
              }}
            </form.Subscribe>
          </form.AppForm>
        )
        : null}
    </form>
  );
}
