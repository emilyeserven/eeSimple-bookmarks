import type { AutofillRule } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useUpdateAutofillRule } from "@/hooks/useAutofill";
import { useAppForm } from "@/lib/form";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  sortOrder: z.number().int(),
});

interface Props {
  rule: AutofillRule;
}

/** Edit an autofill rule's name, description, and sort order. Navigates to the new slug on rename. */
export function AutofillRuleGeneralForm({
  rule,
}: Props) {
  const navigate = useNavigate();
  const updateRule = useUpdateAutofillRule();

  const form = useAppForm({
    defaultValues: {
      name: rule.name,
      description: rule.description ?? "",
      sortOrder: rule.sortOrder,
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({
      value,
    }) => {
      updateRule.mutate(
        {
          id: rule.id,
          input: {
            name: value.name.trim(),
            description: value.description.trim() || null,
            sortOrder: value.sortOrder,
          },
        },
        {
          onSuccess: (updated) => {
            if (updated.slug !== rule.slug) {
              void navigate({
                to: "/autofill/$ruleSlug/edit/general",
                params: {
                  ruleSlug: updated.slug,
                },
              });
            }
          },
        },
      );
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
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            placeholder="e.g. Recipes from 101 Cookbooks"
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {field => <field.TextareaField label="Description" />}
      </form.AppField>

      <form.AppField name="sortOrder">
        {field => (
          <field.NumberField
            label="Priority"
            className="max-w-32"
            hint="Higher numbers win when rules conflict on the category."
          />
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          size="sm"
          requireDirty
        />
      </form.AppForm>
      {updateRule.isError
        ? <p className="text-sm text-destructive">{updateRule.error.message}</p>
        : null}
    </form>
  );
}
