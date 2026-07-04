import type { ImportRule, ImportRuleAction, UpdateImportRuleInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateImportRule } from "../hooks/useImportRules";
import i18n from "../i18n";
import { useAppForm } from "../lib/form";

const ACTION_OPTIONS: { value: ImportRuleAction;
  label: string; }[] = [
  {
    value: "approve",
    label: i18n.t("Approve — create the bookmark automatically"),
  },
  {
    value: "reject",
    label: i18n.t("Reject — mark the item rejected (skip review)"),
  },
  {
    value: "block",
    label: i18n.t("Block — add domain to blacklist and mark blocked"),
  },
];

const schema = z.object({
  name: z.string().trim().min(1, i18n.t("Name is required")),
  description: z.string(),
  action: z.enum(["approve", "reject", "block"]),
  sortOrder: z.number().int(),
});

const LABELS: Partial<Record<keyof UpdateImportRuleInput, string>> = {
  name: i18n.t("Name"),
  description: i18n.t("Description"),
  action: i18n.t("Action"),
  sortOrder: i18n.t("Priority"),
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
  const {
    t,
  } = useTranslation();
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
            label={t("Name")}
            placeholder={t("e.g. Block social media")}
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
            label={t("Description")}
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
            label={t("Action")}
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
            label={t("Priority")}
            className="max-w-32"
            hint={t("Lower numbers run first; the first matching rule wins.")}
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
