import type { AutofillRule } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateAutofillRule } from "../hooks/useAutofill";

interface AddAutofillRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created rule so the opener can navigate to it. */
  onCreated?: (rule: AutofillRule) => void;
}

/** Minimal name-only modal to create an autofill rule inline from the listing page header. */
export function AddAutofillRuleModal({
  open, onOpenChange, onCreated,
}: AddAutofillRuleModalProps) {
  const createRule = useCreateAutofillRule();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New autofill rule"
      description="Give the rule a name — you can fill in the conditions and prefill fields on its edit page."
      placeholder="e.g. YouTube videos"
      submitLabel="Add rule"
      isError={createRule.isError}
      errorMessage={createRule.error?.message}
      onSubmit={(name, done) => {
        createRule.mutate(
          {
            name,
            conditions: emptyConditionTree(),
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
