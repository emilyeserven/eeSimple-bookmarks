import type { ConditionNode, ConditionTree } from "@eesimple/types";

import { z } from "zod";

import i18n from "../i18n";

/**
 * Validates an autofill rule's "when" tree: it must hold at least one condition, and every match
 * leaf needs a non-empty pattern (a valid regular expression when the operator is `regex`). The
 * tree's shape is produced by the builder UI, so this focuses on the user-correctable mistakes.
 */
export const autofillConditionsValidator = z.custom<ConditionTree>().superRefine((tree, ctx) => {
  if (!tree || tree.type !== "group" || tree.children.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Add at least one condition."),
    });
    return;
  }

  let emptyPattern = false;
  let invalidRegex = false;
  let emptyWebsite = false;
  let emptyMediaType = false;
  let emptyGenreMood = false;
  let emptyRelationshipType = false;
  let emptyLocation = false;
  let emptyLanguageUsage = false;
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
    if (node.type === "website" && node.domains.length === 0) emptyWebsite = true;
    if (node.type === "media-type" && node.mediaTypeIds.length === 0) emptyMediaType = true;
    if (node.type === "genre-mood" && node.genreMoodIds.length === 0) emptyGenreMood = true;
    if (node.type === "relationship-type" && node.relationshipTypeIds.length === 0) emptyRelationshipType = true;
    if (node.type === "location" && node.locationIds.length === 0) emptyLocation = true;
    if (node.type === "language-usage" && node.languageIds.length === 0 && node.usageLevelIds.length === 0) emptyLanguageUsage = true;
  };
  walk(tree);

  if (emptyPattern) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Every title condition needs a pattern."),
    });
  }
  if (invalidRegex) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Enter a valid regular expression."),
    });
  }
  if (emptyWebsite) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Pick at least one website."),
    });
  }
  if (emptyMediaType) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Pick at least one media type."),
    });
  }
  if (emptyGenreMood) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Pick at least one Genres & Moods entry."),
    });
  }
  if (emptyRelationshipType) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Pick at least one relationship type."),
    });
  }
  if (emptyLocation) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Pick at least one location."),
    });
  }
  if (emptyLanguageUsage) {
    ctx.addIssue({
      code: "custom",
      message: i18n.t("Pick at least one language or usage level."),
    });
  }
});
