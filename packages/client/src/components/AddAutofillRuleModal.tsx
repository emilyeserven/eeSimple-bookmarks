import type { AutofillRule, CreateAutofillRuleInput } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateAutofillRule } from "../hooks/useAutofill";

interface AddAutofillRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created rule so the opener can navigate to it. */
  onCreated?: (rule: AutofillRule) => void;
  /**
   * Everything besides the name to bake into the created rule — conditions plus any scoped prefill
   * (e.g. the category you came from). Defaults to an empty condition tree.
   */
  prefill?: Omit<CreateAutofillRuleInput, "name">;
}

/** Minimal name-only modal to create an autofill rule inline from the listing page header. */
export function AddAutofillRuleModal({
  open, onOpenChange, onCreated, prefill,
}: AddAutofillRuleModalProps) {
  const createRule = useCreateAutofillRule();
  const {
    t,
  } = useTranslation();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New autofill rule")}
      description={t("Give the rule a name — you can fill in the conditions and prefill fields on its edit page.")}
      placeholder={t("e.g. YouTube videos")}
      submitLabel={t("Add rule")}
      isError={createRule.isError}
      errorMessage={createRule.error?.message}
      onSubmit={(name, done) => {
        createRule.mutate(
          {
            conditions: emptyConditionTree(),
            ...prefill,
            name,
          },
          {
            onSuccess: (rule) => {
              onCreated?.(rule);
              done();
            },
          },
        );
      }}
    />
  );
}
