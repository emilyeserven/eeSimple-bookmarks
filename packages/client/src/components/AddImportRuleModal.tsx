import type { ImportRule } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateImportRule } from "../hooks/useImportRules";

interface AddImportRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (rule: ImportRule) => void;
}

/** Minimal name-only modal to create an import rule inline from the listing page. */
export function AddImportRuleModal({
  open, onOpenChange, onCreated,
}: AddImportRuleModalProps) {
  const createRule = useCreateImportRule();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New import rule"
      description="Give the rule a name — you can set the conditions and action on its edit page."
      placeholder="e.g. Block social media"
      submitLabel="Add rule"
      isError={createRule.isError}
      errorMessage={createRule.error?.message}
      onSubmit={(name, done) => {
        createRule.mutate(
          {
            name,
            conditions: emptyConditionTree(),
            action: "reject",
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
