import type {
  AutofillMatchInput,
  AutofillRule,
  AutofillSuggestions,
} from "@eesimple/types";

import { evaluateConditions, mergeMatchingAutofillRules, urlTitleConditionInput } from "@eesimple/types";

/** The bookmark fields an autofill rule is matched against. */
export type AutofillInput = AutofillMatchInput;

/** The values an autofill rule (or set of rules) suggests for the bookmark form. */
export type AutofillResult = AutofillSuggestions;

/**
 * Whether a rule's conditions are satisfied by what's known when adding a bookmark. Only the
 * URL/title are available at this point, so the bookmark's category, tags, and property values are
 * projected as empty — i.e. category/tag/property condition leaves can't fire yet and a rule
 * effectively triggers on the URL/title-satisfiable part of its tree.
 */
export function matchesRule(rule: AutofillRule, input: AutofillInput): boolean {
  return evaluateConditions(rule.conditions, urlTitleConditionInput(input));
}

/**
 * Combine every matching rule into a single set of suggested values. Tags are unioned; for
 * single-valued targets (category, a property set by more than one rule) the rule with the highest
 * `sortOrder` wins — rules are applied in ascending `sortOrder` so later writers overwrite earlier
 * ones. Delegates to the shared merge in `@eesimple/types` so the form prefill and server-side
 * creation (Inbox approval) apply identical rules.
 */
export function applyAutofill(input: AutofillInput, rules: AutofillRule[]): AutofillResult {
  return mergeMatchingAutofillRules(input, rules);
}
