import type { ConditionValueKind, CustomProperty } from "@eesimple/types";

/**
 * Maps a custom-property type to the predicate value kind its condition row edits. Exhaustive over
 * `ConditionValueKind` — `number`/`calculate`/`ratingScale` filter as `number`, `datetime` as
 * `datetime`, `image`/`file` as `file`, and every other type as `boolean`. Shared by the property
 * condition editor and the card-display-rule scope seed so both agree on a property's filter kind.
 */
export function propertyValueKind(property: CustomProperty): ConditionValueKind {
  switch (property.type) {
    case "number":
    case "calculate":
    case "ratingScale":
      return "number";
    case "datetime":
      return "datetime";
    case "image":
    case "file":
      return "file";
    default:
      return "boolean";
  }
}
