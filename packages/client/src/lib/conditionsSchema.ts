import type { ConditionNode, ConditionTree } from "@eesimple/types";

import { z } from "zod";

/**
 * Validates an autofill rule's "when" tree: it must hold at least one condition, and every match
 * leaf needs a non-empty pattern (a valid regular expression when the operator is `regex`). The
 * tree's shape is produced by the builder UI, so this focuses on the user-correctable mistakes.
 */
export const autofillConditionsValidator = z.custom<ConditionTree>().superRefine((tree, ctx) => {
  if (!tree || tree.type !== "group" || tree.children.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Add at least one condition.",
    });
    return;
  }

  let emptyPattern = false;
  let invalidRegex = false;
  const walk = (node: ConditionNode) => {
    if (node.type === "group") {
      node.children.forEach(walk);
      return;
    }
    if (node.type === "match") {
      if (node.pattern.trim() === "") emptyPattern = true;
      else if (node.operator === "regex") {
        try {
          new RegExp(node.pattern);
        }
        catch {
          invalidRegex = true;
        }
      }
    }
  };
  walk(tree);

  if (emptyPattern) {
    ctx.addIssue({
      code: "custom",
      message: "Every match condition needs a pattern.",
    });
  }
  if (invalidRegex) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a valid regular expression.",
    });
  }
});
