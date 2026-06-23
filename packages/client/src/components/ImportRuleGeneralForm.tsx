import type { ImportRule, ImportRuleAction, UpdateImportRuleInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateImportRule } from "../hooks/useImportRules";
import { useAppForm } from "../lib/form";

const ACTION_OPTIONS: { value: ImportRuleAction;
  label: string; }[] = [
  {
    value: "approve",
    label: "Approve — create the bookmark automatically",
  },
  {
    value: "reject",
    label: "Reject — mark the item rejected (skip review)",
  },
  {
    value: "block",
    label: "Block — add domain to blacklist and mark blocked",
  },
];

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  action: z.enum(["approve", "reject", "block"]),
  sortOrder: z.number().int(),
});

const LABELS: Partial<Record<keyof UpdateImportRuleInput, string>> = {
  name: "Name",
  description: "Description",
  action: "Action",
  sortOrder: "Priority",
};

interface Props {
  rule: ImportRule;
}

/**
 * Edit an import rule's name, description, action, and sort order. Each field auto-saves
 * (no Save button); renaming follows the new slug so the edit page keeps resolving.
 */
export function ImportRuleGeneralForm({
  rule,
}: Props) {
  const navigate = useNavigate();
  const updateRule = useUpdateImportRule();
  const autoSave = useFieldAutoSave<UpdateImportRuleInput, ImportRule>({
    id: rule.id,
    update: updateRule,
    labels: LABELS,
    initial: {
      name: rule.name,
      description: rule.description ?? null,
      action: rule.action,
      sortOrder: rule.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: rule.name,
      description: rule.description ?? "",
      action: rule.action as string,
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
            label="Name"
            placeholder="e.g. Block social media"
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                onSuccess: (updated) => {
                  if (updated.slug !== rule.slug) {
                    void navigate({
                      to: "/import-rules/$ruleSlug/edit/general",
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
            label="Description"
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

      <form.AppField name="action">
        {field => (
          <field.SelectField
            label="Action"
            options={ACTION_OPTIONS}
            onValueChange={value => autoSave.saveField(
              "action",
              value as ImportRuleAction,
              {
                valid: true,
              },
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="sortOrder">
        {field => (
          <field.NumberField
            label="Priority"
            className="max-w-32"
            hint="Lower numbers run first; the first matching rule wins."
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
