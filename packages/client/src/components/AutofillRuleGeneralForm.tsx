import type { AutofillRule, UpdateAutofillRuleInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useUpdateAutofillRule } from "../hooks/useAutofill";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  sortOrder: z.number().int(),
});

const LABELS: Partial<Record<keyof UpdateAutofillRuleInput, string>> = {
  name: "Name",
  description: "Description",
  sortOrder: "Priority",
};

interface Props {
  rule: AutofillRule;
}

/**
 * Edit an autofill rule's name, description, and sort order. Each field auto-saves (no Save button);
 * renaming follows the new slug so the edit page keeps resolving.
 */
export function AutofillRuleGeneralForm({
  rule,
}: Props) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateRule = useUpdateAutofillRule();
  const autoSave = useFieldAutoSave<UpdateAutofillRuleInput, AutofillRule>({
    id: rule.id,
    update: updateRule,
    labels: LABELS,
    initial: {
      name: rule.name,
      description: rule.description ?? null,
      sortOrder: rule.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: rule.name,
      description: rule.description ?? "",
      sortOrder: rule.sortOrder,
    },
    validators: {
      onChange: schema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            placeholder={t("e.g. Recipes from 101 Cookbooks")}
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== rule.slug) {
                    void navigate({
                      to: "/autofill/$ruleSlug/edit",
                      params: {
                        ruleSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
            debounceSave
            onBlur={() => autoSave.saveField(
              "description",
              field.state.value.trim() || null,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="sortOrder">
        {field => (
          <field.NumberField
            label={t("Priority")}
            className="max-w-32"
            hint={t("Higher numbers win when rules conflict on the category.")}
            onBlur={() => autoSave.saveField(
              "sortOrder",
              field.state.value,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>
    </div>
  );
}
