import type {
  CardDisplayRule,
  ConditionNode,
  ConditionTree,
  ConditionValueKind,
  PropertyCondition,
} from "@eesimple/types";

import { emptyConditionTree, normalizeDomain } from "@eesimple/types";

/**
 * Walk a rule's condition tree and return true when any leaf satisfies `pred`. Group nodes recurse
 * through their `children`; every other node is a leaf the predicate inspects. This is the card-display
 * sibling of `lib/autofillRulesFilter.ts`'s per-leaf `visit` helpers — card display rules are
 * condition-only (no "set" actions), so *every* entity scope here is matched by walking the tree.
 */
function anyLeaf(rule: CardDisplayRule, pred: (node: ConditionNode) => boolean): boolean {
  const visit = (node: ConditionNode): boolean => {
    if (node.type === "group") return node.children.some(visit);
    return pred(node);
  };
  return visit(rule.conditions);
}

/** True when a Category condition in the rule's tree references `categoryId`. */
export function ruleReferencesCategory(rule: CardDisplayRule, categoryId: string): boolean {
  return anyLeaf(rule, node => node.type === "category" && node.categoryIds.includes(categoryId));
}

/** True when a Property condition in the rule's tree references `propertyId`. */
export function ruleReferencesProperty(rule: CardDisplayRule, propertyId: string): boolean {
  return anyLeaf(rule, node => node.type === "property" && node.propertyId === propertyId);
}

/**
 * True when any Property condition in the rule's tree references one of `propertyIds`. Used to scope
 * the Display Rules tab to a property *group*: a group has no condition leaf of its own, so a rule
 * "applies to" the group when it references any custom property belonging to it.
 */
export function ruleReferencesAnyProperty(rule: CardDisplayRule, propertyIds: ReadonlySet<string>): boolean {
  if (propertyIds.size === 0) return false;
  return anyLeaf(rule, node => node.type === "property" && propertyIds.has(node.propertyId));
}

/** True when a Website condition in the rule's tree references `domain` (already normalized). */
export function ruleReferencesWebsite(rule: CardDisplayRule, domain: string): boolean {
  return anyLeaf(rule, node => node.type === "website" && node.domains.some(d => normalizeDomain(d) === domain));
}

/** True when a Tag condition in the rule's tree references `tagId` (exact, no cascade). */
export function ruleReferencesTag(rule: CardDisplayRule, tagId: string): boolean {
  return anyLeaf(rule, node => node.type === "tag" && node.tagIds.includes(tagId));
}

/** True when a Media Type condition in the rule's tree references `mediaTypeId`. */
export function ruleReferencesMediaType(rule: CardDisplayRule, mediaTypeId: string): boolean {
  return anyLeaf(rule, node => node.type === "media-type" && node.mediaTypeIds.includes(mediaTypeId));
}

/** True when a YouTube Channel condition in the rule's tree references `channelId`. */
export function ruleReferencesYoutubeChannel(rule: CardDisplayRule, channelId: string): boolean {
  return anyLeaf(rule, node => node.type === "youtube-channel" && node.channelIds.includes(channelId));
}

/** True when a Location condition in the rule's tree references `locationId` (exact, no cascade). */
export function ruleReferencesLocation(rule: CardDisplayRule, locationId: string): boolean {
  return anyLeaf(rule, node => node.type === "location" && node.locationIds.includes(locationId));
}

/**
 * The entity a Display Rules tab is scoped to. Only the field for the current tab is set; for the
 * property scope the value kind travels alongside the id so the seeded predicate is well-typed.
 */
export interface CardDisplayRuleScope {
  categoryId?: string;
  /** Normalized website domain (card display rules reference websites by domain, not id). */
  websiteDomain?: string;
  tagId?: string;
  mediaTypeId?: string;
  locationId?: string;
  channelId?: string;
  property?: { id: string;
    valueKind: ConditionValueKind; };
}

/** A "has a value" property leaf, typed per value kind (presence is valid for every kind). */
function propertyPresenceLeaf(propertyId: string, valueKind: ConditionValueKind): PropertyCondition {
  const presence = {
    kind: "presence",
    mode: "has",
  } as const;
  switch (valueKind) {
    case "number":
      return {
        type: "property",
        propertyId,
        predicate: {
          valueKind: "number",
          predicate: presence,
        },
      };
    case "datetime":
      return {
        type: "property",
        propertyId,
        predicate: {
          valueKind: "datetime",
          predicate: presence,
        },
      };
    case "file":
      return {
        type: "property",
        propertyId,
        predicate: {
          valueKind: "file",
          predicate: presence,
        },
      };
    case "boolean":
      return {
        type: "property",
        propertyId,
        predicate: {
          valueKind: "boolean",
          predicate: presence,
        },
      };
    case "choices":
      return {
        type: "property",
        propertyId,
        predicate: {
          valueKind: "choices",
          predicate: presence,
        },
      };
    case "sections":
      return {
        type: "property",
        propertyId,
        predicate: {
          valueKind: "sections",
          predicate: presence,
        },
      };
    case "text":
      return {
        type: "property",
        propertyId,
        predicate: {
          valueKind: "text",
          predicate: presence,
        },
      };
  }
}

/**
 * Initial condition tree for a new display rule created from an entity's Display Rules tab: one leaf
 * referencing that entity, so the rule immediately matches the scope and appears in the scoped list.
 * Mirrors `lib/autofillPrefill.ts`'s `seedConditions`, but seeds every entity as a *condition* (card
 * display rules have no "set" actions). With no scope set it returns an empty tree.
 */
export function seedCardDisplayConditions(scope: CardDisplayRuleScope): ConditionTree {
  const tree = emptyConditionTree();
  const leaves: ConditionTree["children"] = [];
  if (scope.categoryId) {
    leaves.push({
      type: "category",
      categoryIds: [scope.categoryId],
    });
  }
  if (scope.websiteDomain) {
    leaves.push({
      type: "website",
      domains: [scope.websiteDomain],
    });
  }
  if (scope.tagId) {
    leaves.push({
      type: "tag",
      tagIds: [scope.tagId],
    });
  }
  if (scope.mediaTypeId) {
    leaves.push({
      type: "media-type",
      mediaTypeIds: [scope.mediaTypeId],
    });
  }
  if (scope.locationId) {
    leaves.push({
      type: "location",
      locationIds: [scope.locationId],
    });
  }
  if (scope.channelId) {
    leaves.push({
      type: "youtube-channel",
      channelIds: [scope.channelId],
    });
  }
  if (scope.property) {
    leaves.push(propertyPresenceLeaf(scope.property.id, scope.property.valueKind));
  }
  if (leaves.length === 0) return tree;
  return {
    ...tree,
    children: leaves,
  };
}
