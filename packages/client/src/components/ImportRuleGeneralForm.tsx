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

const nameSchema = z.object({
  name: z.string().trim().min(1, i18n.t("Name is required")),
});

const descriptionSchema = z.object({
  description: z.string(),
});

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "block"]),
});

const sortOrderSchema = z.object({
  sortOrder: z.number().int(),
});

const NAME_LABELS: Partial<Record<keyof UpdateImportRuleInput, string>> = {
  name: i18n.t("Name"),
};

const DESCRIPTION_LABELS: Partial<Record<keyof UpdateImportRuleInput, string>> = {
  description: i18n.t("Description"),
};

const ACTION_LABELS: Partial<Record<keyof UpdateImportRuleInput, string>> = {
  action: i18n.t("Action"),
};

const SORT_ORDER_LABELS: Partial<Record<keyof UpdateImportRuleInput, string>> = {
  sortOrder: i18n.t("Priority"),
};

interface ImportRuleFieldProps {
  rule: ImportRule;
}

/**
 * The import rule's name. A standalone placeable field (the `name` field in the registry); it mounts its
 * own `useAppForm` + `useFieldAutoSave` (no cross-field coordination — the Category #1186 precedent).
 * Auto-saves on blur and follows the new slug.
 */
export function ImportRuleNameEditField({
  rule,
}: ImportRuleFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateRule = useUpdateImportRule();
  const autoSave = useFieldAutoSave<UpdateImportRuleInput, ImportRule>({
    id: rule.id,
    update: updateRule,
    labels: NAME_LABELS,
    initial: {
      name: rule.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: rule.name,
    },
    validators: {
      onChange: nameSchema,
    },
  });

  return (
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
                    to: "/import-rules/$ruleSlug/edit",
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
  );
}

/** The import rule's description. A standalone placeable field; saves on blur. */
export function ImportRuleDescriptionEditField({
  rule,
}: ImportRuleFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateRule = useUpdateImportRule();
  const autoSave = useFieldAutoSave<UpdateImportRuleInput, ImportRule>({
    id: rule.id,
    update: updateRule,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: rule.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: rule.description ?? "",
    },
    validators: {
      onChange: descriptionSchema,
    },
  });

  return (
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
  );
}

/** The import rule's action. A standalone placeable field; saves on change. */
export function ImportRuleActionEditField({
  rule,
}: ImportRuleFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateRule = useUpdateImportRule();
  const autoSave = useFieldAutoSave<UpdateImportRuleInput, ImportRule>({
    id: rule.id,
    update: updateRule,
    labels: ACTION_LABELS,
    initial: {
      action: rule.action,
    },
  });

  const form = useAppForm({
    defaultValues: {
      action: rule.action as string,
    },
    validators: {
      onChange: actionSchema,
    },
  });

  return (
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
  );
}

/** The import rule's priority (sort order). A standalone placeable field; saves on blur. */
export function ImportRuleSortOrderEditField({
  rule,
}: ImportRuleFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateRule = useUpdateImportRule();
  const autoSave = useFieldAutoSave<UpdateImportRuleInput, ImportRule>({
    id: rule.id,
    update: updateRule,
    labels: SORT_ORDER_LABELS,
    initial: {
      sortOrder: rule.sortOrder,
    },
  });

  const form = useAppForm({
    defaultValues: {
      sortOrder: rule.sortOrder,
    },
    validators: {
      onChange: sortOrderSchema,
    },
  });

  return (
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
  );
}

interface Props {
  rule: ImportRule;
}

/**
 * Edit an import rule's name, description, action, and priority. Each field auto-saves (no Save button).
 * Composed from the same placeable sub-fields the import-rule workbench registry uses, so this whole-form
 * shell (used by `ImportRuleGeneralForm.stories.tsx`) stays in lockstep with the layout-driven General
 * tab.
 */
export function ImportRuleGeneralForm({
  rule,
}: Props) {
  return (
    <div className="space-y-4">
      <ImportRuleNameEditField rule={rule} />
      <ImportRuleDescriptionEditField rule={rule} />
      <ImportRuleActionEditField rule={rule} />
      <ImportRuleSortOrderEditField rule={rule} />
    </div>
  );
}
