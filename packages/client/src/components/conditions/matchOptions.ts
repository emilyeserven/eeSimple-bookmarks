import type { ConditionMatchField, ConditionMatchOperator } from "@eesimple/types";

/** Field options for a match condition (which bookmark text the pattern tests). */
export const FIELD_OPTIONS: { value: ConditionMatchField;
  label: string; }[] = [
  {
    value: "url",
    label: "URL",
  },
  {
    value: "title",
    label: "Title",
  },
];

/** Operator options for a match condition. */
export const OPERATOR_OPTIONS: { value: ConditionMatchOperator;
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
  {
    value: "domain",
    label: "Domain is",
  },
];

/** Short verbs used when rendering a human-readable summary of a match condition. */
export const OPERATOR_LABELS: Record<ConditionMatchOperator, string> = {
  contains: "contains",
  starts_with: "starts with",
  regex: "matches",
  domain: "domain is",
};

/** Display names for a match field. */
export const FIELD_LABELS: Record<ConditionMatchField, string> = {
  url: "URL",
  title: "title",
};
