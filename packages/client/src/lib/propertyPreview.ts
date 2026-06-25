import type { CustomProperty } from "@eesimple/types";

/**
 * The short summary line shown on a property preview: a number property's min–max range
 * (with optional unit), or a calculate property's resolved operand sum. `null` for every
 * other type (and for a calculate property with no resolvable operands).
 */
export function propertyPreviewSummary(property: CustomProperty, allProperties: CustomProperty[]): string | null {
  if (property.type === "number") {
    return `${property.numberMin ?? "auto"} – ${property.numberMax ?? "auto"}`
      + (property.unitPlural ? ` ${property.unitPlural}` : "");
  }
  if (property.type === "calculate") {
    const operandNames = property.operandPropertyIds
      .map(id => allProperties.find(candidate => candidate.id === id)?.name)
      .filter((value): value is string => Boolean(value));
    if (operandNames.length > 0) return `Σ ${operandNames.join(" + ")}`;
  }
  return null;
}
