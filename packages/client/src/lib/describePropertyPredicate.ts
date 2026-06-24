import type {
  BooleanPredicate,
  CustomProperty,
  DateTimePredicate,
  NumberPredicate,
  PropertyCondition,
} from "@eesimple/types";

import { formatDateTime } from "./bookmarkFormat";

/** Human phrase for a presence predicate, shared by every value kind. */
function describePresence(mode: "has" | "missing"): string {
  return mode === "has" ? "has a value" : "has no value";
}

function describeNumberPredicate(predicate: NumberPredicate): string {
  if (predicate.kind === "presence") return describePresence(predicate.mode);
  const {
    min, max,
  } = predicate;
  if (min !== null && max !== null) return `between ${min} and ${max}`;
  if (min !== null) return `at least ${min}`;
  if (max !== null) return `at most ${max}`;
  return "any value";
}

function describeBooleanPredicate(predicate: BooleanPredicate): string {
  if (predicate.kind === "presence") return describePresence(predicate.mode);
  return predicate.value ? "Yes" : "No";
}

function describeDateTimePredicate(
  predicate: DateTimePredicate,
  property: CustomProperty | undefined,
): string {
  if (predicate.kind === "presence") return describePresence(predicate.mode);
  const fmt = (s: string) => (property ? formatDateTime(s, property) : s);
  const {
    from, to,
  } = predicate;
  if (from !== null && to !== null) return `from ${fmt(from)} to ${fmt(to)}`;
  if (from !== null) return `from ${fmt(from)}`;
  if (to !== null) return `to ${fmt(to)}`;
  return "any value";
}

/**
 * A short human description of a property-condition predicate (e.g. `"between 1 and 5"`,
 * `"has no value"`, `"from 2024-01-01"`), used in autofill rule summaries. Dispatches on the
 * predicate's value kind; `property` supplies the date/time format for datetime predicates.
 */
export function describePropertyPredicate(
  predicate: PropertyCondition["predicate"],
  property: CustomProperty | undefined,
): string {
  switch (predicate.valueKind) {
    case "number":
      return describeNumberPredicate(predicate.predicate);
    case "boolean":
      return describeBooleanPredicate(predicate.predicate);
    case "datetime":
      return describeDateTimePredicate(predicate.predicate, property);
    case "file":
      return describePresence(predicate.predicate.mode);
    case "choices": {
      const pred = predicate.predicate;
      if (pred.kind === "presence") return describePresence(pred.mode);
      return pred.values.length === 0 ? "any value" : `includes ${pred.values.join(", ")}`;
    }
    case "sections": {
      const pred = predicate.predicate;
      if (pred.kind === "presence") return describePresence(pred.mode);
      if (pred.kind === "exhaustive") return pred.value ? "all sections listed" : "not all sections listed";
      return pred.types.length === 0 ? "any section type" : `has ${pred.types.join(", ")} sections`;
    }
    case "text": {
      const pred = predicate.predicate;
      if (pred.kind === "presence") return describePresence(pred.mode);
      return pred.pattern ? `contains "${pred.pattern}"` : "contains anything";
    }
  }
}
