import type { ConditionMatchOperator } from "@eesimple/types";

/**
 * Operator options offered when authoring a Title / Name match. `domain` is intentionally absent:
 * website matching now has its own dedicated condition (see `WebsiteConditionEditor`); the
 * `domain` operator and the `url` field survive only in the shared type for evaluating legacy
 * stored trees.
 */
export const OPERATOR_OPTIONS: { value: Exclude<ConditionMatchOperator, "domain">;
  label: string; }[] = [
  {
    value: "contains",
    label: "Contains",
  },
  {
    value: "starts_with",
    label: "Starts with",
  },
  {
    value: "regex",
    label: "Regex",
  },
];

/** Short verbs used when rendering a human-readable summary of a match condition. */
export const OPERATOR_LABELS: Record<ConditionMatchOperator, string> = {
  contains: "contains",
  starts_with: "starts with",
  regex: "matches",
  domain: "domain is",
};
