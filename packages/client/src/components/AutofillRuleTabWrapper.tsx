import { createTabWrapper } from "./TabWrapper";

import { useAutofillRuleBySlug } from "@/hooks/useAutofill";

/** Loads an autofill rule by slug and renders a tab's title + description header above its content. */
export const AutofillRuleTabWrapper = createTabWrapper(
  "ruleSlug",
  useAutofillRuleBySlug,
  result => result.rule,
  "Autofill rule not found.",
);
