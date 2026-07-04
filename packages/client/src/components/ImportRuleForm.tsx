import type { CreateImportRuleInput, ImportRuleAction } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useAppForm } from "../lib/form";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  action: z.enum(["approve", "reject", "block"]),
});

interface ImportRuleFormProps {
  submitLabel?: string;
  isError: boolean;
  errorMessage?: string;
  onSubmit: (input: CreateImportRuleInput) => void;
}

/** Create-only submit form for a new import rule (name + action). */
export function ImportRuleForm({
  submitLabel,
  isError,
  errorMessage,
  onSubmit,
}: ImportRuleFormProps) {
  const {
    t,
  } = useTranslation();
  const ACTION_OPTIONS: { value: string;
    label: string; }[] = [
    {
      value: "reject",
      label: t("Reject — skip manual review"),
    },
    {
      value: "approve",
      label: t("Approve — create the bookmark automatically"),
    },
    {
      value: "block",
      label: t("Block — add domain to blacklist"),
    },
  ];
  const form = useAppForm({
    defaultValues: {
      name: "",
      action: "reject" as string,
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({
      value,
    }) => {
      onSubmit({
        name: value.name.trim(),
        action: value.action as ImportRuleAction,
        conditions: emptyConditionTree(),
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
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            placeholder={t("e.g. Block social media")}
          />
        )}
      </form.AppField>

      <form.AppField name="action">
        {field => (
          <field.SelectField
            label={t("Action")}
            options={ACTION_OPTIONS}
          />
        )}
      </form.AppField>

      {isError ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <form.AppForm>
        <form.SubmitButton
          label={submitLabel ?? t("Add rule")}
          pendingLabel={t("Adding…")}
        />
      </form.AppForm>
    </form>
  );
}
