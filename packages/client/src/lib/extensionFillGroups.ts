import type {
  ExtensionFillOverrides,
  ExtensionFillRuleGroup,
  FillTarget,
  OverrideKey,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

import { OVERRIDE_KEYS, TAXONOMY_ENTITY_SPECS } from "@eesimple/types";

import { coerceFillTarget, directFieldSupported, taxonomyEntityWriteKeys } from "./extensionFillForm";
import { randomId } from "./utils";

/**
 * Pure logic behind the Extension Fill **rule groups** feature (see
 * `packages/types/src/extensionFillGroups.ts`). A group forces some of its rules' option values;
 * those values are **materialized** onto each member rule so the stored rule stays self-complete for
 * the browser extension. This module owns: the {@link OVERRIDE_REGISTRY} (per-key apply/read/gate),
 * override resolution + materialization, the "which options are locked on this rule" query, the
 * drag/membership reducers, and the group CRUD + two-tier nesting guard. Every export is pure and
 * unit-tested (`extensionFillGroups.test.ts`).
 */

// ---------------------------------------------------------------------------
// Override registry — per-key materializer / reader / applicability gate
// ---------------------------------------------------------------------------

type OverrideValue<K extends OverrideKey> = NonNullable<ExtensionFillOverrides[K]>;

interface OverrideSpec<K extends OverrideKey> {
  /** Write the override value onto the rule (materialize). A no-op when `isApplicable` is false. */
  apply: (rule: WebsiteExtensionFillRule, value: OverrideValue<K>) => WebsiteExtensionFillRule;
  /** The rule's current value for this option, or `undefined` when the option doesn't apply. */
  read: (rule: WebsiteExtensionFillRule) => OverrideValue<K> | undefined;
  /** Whether this option is meaningful for the given (effective) target. */
  isApplicable: (target: FillTarget) => boolean;
}

type OverrideRegistry = { [K in OverrideKey]: OverrideSpec<K> };

/** Replace `rule.target` (helper to keep the per-key `apply`s terse). */
function withTarget(rule: WebsiteExtensionFillRule, target: FillTarget): WebsiteExtensionFillRule {
  return {
    ...rule,
    target,
  };
}

/** Clamp a taxonomyEntity target's `field` to one its association supports (keeps the socialPlatform). */
function clampEntityField(
  target: Extract<FillTarget, { kind: "taxonomyEntity" }>,
): Extract<FillTarget, { kind: "taxonomyEntity" }> {
  const keys = taxonomyEntityWriteKeys(target.association);
  const field = keys.includes(target.field) ? target.field : keys[0];
  return {
    ...target,
    field,
  };
}

/** Clamp a taxonomyDirect target's `field` to one its association supports. */
function clampDirectField(
  target: Extract<FillTarget, { kind: "taxonomyDirect" }>,
): Extract<FillTarget, { kind: "taxonomyDirect" }> {
  const field = directFieldSupported(target.association, target.field)
    ? target.field
    : TAXONOMY_ENTITY_SPECS[target.association].fields[0];
  return {
    ...target,
    field,
  };
}

export const OVERRIDE_REGISTRY: OverrideRegistry = {
  "pathMatch": {
    apply: (rule, value) => ({
      ...rule,
      pathMatch: value,
    }),
    read: rule => rule.pathMatch,
    isApplicable: () => true,
  },
  "target.kind": {
    // Reuse the editor's kind-change coercion so the new target keeps a same-kind value where it can.
    apply: (rule, value) => withTarget(rule, coerceFillTarget(value, rule.target)),
    read: rule => rule.target.kind,
    isApplicable: () => true,
  },
  "field.field": {
    apply: (rule, value) => (rule.target.kind === "field"
      ? withTarget(rule, {
        kind: "field",
        field: value,
      })
      : rule),
    read: rule => (rule.target.kind === "field" ? rule.target.field : undefined),
    isApplicable: target => target.kind === "field",
  },
  "customProperty.propertyId": {
    apply: (rule, value) => (rule.target.kind === "customProperty"
      ? withTarget(rule, {
        ...rule.target,
        propertyId: value,
      })
      : rule),
    read: rule => (rule.target.kind === "customProperty" ? rule.target.propertyId : undefined),
    isApplicable: target => target.kind === "customProperty",
  },
  "customProperty.subField": {
    apply: (rule, value) => (rule.target.kind === "customProperty"
      ? withTarget(rule, {
        ...rule.target,
        subField: value,
      })
      : rule),
    read: rule => (rule.target.kind === "customProperty" ? rule.target.subField : undefined),
    isApplicable: target => target.kind === "customProperty",
  },
  "customProperty.choiceValue": {
    apply: (rule, value) => (rule.target.kind === "customProperty"
      ? withTarget(rule, {
        ...rule.target,
        choiceValue: value,
      })
      : rule),
    read: rule => (rule.target.kind === "customProperty" ? rule.target.choiceValue : undefined),
    isApplicable: target => target.kind === "customProperty",
  },
  "taxonomy.taxonomy": {
    apply: (rule, value) => (rule.target.kind === "taxonomy"
      ? withTarget(rule, {
        kind: "taxonomy",
        taxonomy: value,
      })
      : rule),
    read: rule => (rule.target.kind === "taxonomy" ? rule.target.taxonomy : undefined),
    isApplicable: target => target.kind === "taxonomy",
  },
  "image.setMain": {
    apply: (rule, value) => (rule.target.kind === "image"
      ? withTarget(rule, {
        kind: "image",
        setMain: value,
      })
      : rule),
    read: rule => (rule.target.kind === "image" ? rule.target.setMain : undefined),
    isApplicable: target => target.kind === "image",
  },
  "taxonomyEntity.association": {
    apply: (rule, value) => (rule.target.kind === "taxonomyEntity"
      ? withTarget(rule, clampEntityField({
        ...rule.target,
        association: value,
      }))
      : rule),
    read: rule => (rule.target.kind === "taxonomyEntity" ? rule.target.association : undefined),
    isApplicable: target => target.kind === "taxonomyEntity",
  },
  "taxonomyEntity.field": {
    apply: (rule, value) => (rule.target.kind === "taxonomyEntity"
      ? withTarget(rule, {
        ...rule.target,
        field: value,
      })
      : rule),
    read: rule => (rule.target.kind === "taxonomyEntity" ? rule.target.field : undefined),
    isApplicable: target => target.kind === "taxonomyEntity",
  },
  "taxonomyEntity.socialPlatform": {
    apply: (rule, value) => (rule.target.kind === "taxonomyEntity"
      ? withTarget(rule, {
        ...rule.target,
        socialPlatform: value,
      })
      : rule),
    read: rule => (rule.target.kind === "taxonomyEntity" ? rule.target.socialPlatform : undefined),
    isApplicable: target => target.kind === "taxonomyEntity" && target.field === "socialLink",
  },
  "taxonomyDirect.association": {
    apply: (rule, value) => (rule.target.kind === "taxonomyDirect"
      ? withTarget(rule, clampDirectField({
        ...rule.target,
        association: value,
      }))
      : rule),
    read: rule => (rule.target.kind === "taxonomyDirect" ? rule.target.association : undefined),
    isApplicable: target => target.kind === "taxonomyDirect",
  },
  "taxonomyDirect.resolve": {
    apply: (rule, value) => (rule.target.kind === "taxonomyDirect"
      ? withTarget(rule, {
        ...rule.target,
        resolve: value,
      })
      : rule),
    read: rule => (rule.target.kind === "taxonomyDirect" ? rule.target.resolve : undefined),
    isApplicable: target => target.kind === "taxonomyDirect",
  },
  "taxonomyDirect.field": {
    apply: (rule, value) => (rule.target.kind === "taxonomyDirect"
      ? withTarget(rule, clampDirectField({
        ...rule.target,
        field: value,
      }))
      : rule),
    read: rule => (rule.target.kind === "taxonomyDirect" ? rule.target.field : undefined),
    isApplicable: target => target.kind === "taxonomyDirect",
  },
  "taxonomyDirect.socialPlatform": {
    apply: (rule, value) => (rule.target.kind === "taxonomyDirect"
      ? withTarget(rule, {
        ...rule.target,
        socialPlatform: value,
      })
      : rule),
    read: rule => (rule.target.kind === "taxonomyDirect" ? rule.target.socialPlatform : undefined),
    isApplicable: target => target.kind === "taxonomyDirect" && target.field === "socialLink",
  },
  "sections.propertyId": {
    apply: (rule, value) => (rule.target.kind === "sections"
      ? withTarget(rule, {
        ...rule.target,
        propertyId: value,
      })
      : rule),
    read: rule => (rule.target.kind === "sections" ? rule.target.propertyId : undefined),
    isApplicable: target => target.kind === "sections",
  },
  "sections.entryType": {
    apply: (rule, value) => (rule.target.kind === "sections"
      ? withTarget(rule, {
        ...rule.target,
        entryType: value,
      })
      : rule),
    read: rule => (rule.target.kind === "sections" ? rule.target.entryType : undefined),
    isApplicable: target => target.kind === "sections",
  },
  "sections.layout": {
    apply: (rule, value) => (rule.target.kind === "sections"
      ? withTarget(rule, {
        kind: "sections",
        propertyId: rule.target.propertyId,
        entryType: rule.target.entryType,
        ...value,
      })
      : rule),
    read: rule => (rule.target.kind === "sections"
      ? {
        container: rule.target.container,
        header: rule.target.header,
        itemName: rule.target.itemName,
        itemUrl: rule.target.itemUrl,
        sectionMatch: rule.target.sectionMatch,
        sectionHeaderSelector: rule.target.sectionHeaderSelector,
      }
      : undefined),
    isApplicable: target => target.kind === "sections",
  },
};

// ---------------------------------------------------------------------------
// Override resolution + materialization
// ---------------------------------------------------------------------------

/** The group ancestry chain for a rule's group, root-first (`[outer, inner]`, ≤2 entries). */
export function resolveGroupChain(
  groups: ExtensionFillRuleGroup[],
  groupId: string | undefined,
): ExtensionFillRuleGroup[] {
  const chain: ExtensionFillRuleGroup[] = [];
  let currentId = groupId;
  // Cap at 2 hops so a malformed cycle can never loop forever (nesting is guarded to depth 2 anyway).
  for (let hop = 0; hop < 2 && currentId; hop++) {
    const group = groups.find(candidate => candidate.id === currentId);
    if (!group) break;
    chain.unshift(group);
    currentId = group.parentId;
  }
  return chain;
}

/** Merge a rule-group chain's overrides root→leaf (the innermost group wins on a shared key). */
export function effectiveOverrides(
  groups: ExtensionFillRuleGroup[],
  groupId: string | undefined,
): ExtensionFillOverrides {
  const merged: ExtensionFillOverrides = {};
  for (const group of resolveGroupChain(groups, groupId)) {
    Object.assign(merged, group.overrides);
  }
  return merged;
}

/**
 * Materialize an override map onto a rule. Keys apply in {@link OVERRIDE_KEYS} order — `pathMatch`,
 * then `target.kind` (which may swap the target), then the per-kind keys — so a kind swap never
 * clobbers a per-kind key that follows it. A key whose value is absent or that isn't applicable to
 * the (running) target is skipped.
 */
export function applyOverrides(
  rule: WebsiteExtensionFillRule,
  overrides: ExtensionFillOverrides,
): WebsiteExtensionFillRule {
  let next = rule;
  for (const key of OVERRIDE_KEYS) {
    const value = overrides[key];
    if (value === undefined) continue;
    const spec = OVERRIDE_REGISTRY[key];
    if (!spec.isApplicable(next.target)) continue;
    // The registry entry's value type is exactly OverrideValue<key>; the loop widens it, so assert.
    next = spec.apply(next, value as never);
  }
  return next;
}

/** Materialize a single rule against its group chain (idempotent for an ungrouped rule). */
export function materializeRule(
  groups: ExtensionFillRuleGroup[],
  rule: WebsiteExtensionFillRule,
): WebsiteExtensionFillRule {
  return applyOverrides(rule, effectiveOverrides(groups, rule.groupId));
}

/** Re-materialize every rule against the groups — run before every save and after any group edit. */
export function materializeAll(
  groups: ExtensionFillRuleGroup[],
  rules: WebsiteExtensionFillRule[],
): WebsiteExtensionFillRule[] {
  return rules.map(rule => materializeRule(groups, rule));
}

/**
 * The override keys locked (group-controlled, so read-only) on a rule — the union of its chain's set
 * overrides that apply to the rule's current target.
 */
export function lockedKeysForRule(
  groups: ExtensionFillRuleGroup[],
  rule: WebsiteExtensionFillRule,
): Set<OverrideKey> {
  const overrides = effectiveOverrides(groups, rule.groupId);
  const locked = new Set<OverrideKey>();
  for (const key of OVERRIDE_KEYS) {
    if (overrides[key] === undefined) continue;
    if (OVERRIDE_REGISTRY[key].isApplicable(rule.target)) locked.add(key);
  }
  return locked;
}

// ---------------------------------------------------------------------------
// Membership reducers (drag / reorder / group buttons)
// ---------------------------------------------------------------------------

/** Move `ruleId` to sit just before `beforeRuleId` (or to the end when omitted), preserving the rest. */
function repositionRule(
  rules: WebsiteExtensionFillRule[],
  ruleId: string,
  beforeRuleId?: string,
): WebsiteExtensionFillRule[] {
  const moving = rules.find(rule => rule.id === ruleId);
  if (!moving) return rules;
  const without = rules.filter(rule => rule.id !== ruleId);
  const at = beforeRuleId ? without.findIndex(rule => rule.id === beforeRuleId) : -1;
  if (at === -1) return [...without, moving];
  return [...without.slice(0, at), moving, ...without.slice(at)];
}

/**
 * Assign a rule to a group (drag into / between groups): sets `groupId`, **materializes** the group's
 * override values onto it (overwrite semantics), and positions it before `beforeRuleId`.
 */
export function assignRuleToGroup(
  groups: ExtensionFillRuleGroup[],
  rules: WebsiteExtensionFillRule[],
  ruleId: string,
  groupId: string,
  beforeRuleId?: string,
): WebsiteExtensionFillRule[] {
  const assigned = rules.map(rule =>
    (rule.id === ruleId
      ? materializeRule(groups, {
        ...rule,
        groupId,
      })
      : rule));
  return repositionRule(assigned, ruleId, beforeRuleId);
}

/** Reorder a rule within its current home (no group change, no re-materialize). */
export function reorderRuleWithinGroup(
  rules: WebsiteExtensionFillRule[],
  ruleId: string,
  beforeRuleId?: string,
): WebsiteExtensionFillRule[] {
  return repositionRule(rules, ruleId, beforeRuleId);
}

/** Remove a rule from its group (explicit button): clears `groupId`, **keeps** its materialized values. */
export function removeRuleFromGroup(
  rules: WebsiteExtensionFillRule[],
  ruleId: string,
): WebsiteExtensionFillRule[] {
  return rules.map((rule) => {
    if (rule.id !== ruleId) return rule;
    const {
      groupId: _dropped, ...rest
    } = rule;
    return rest;
  });
}

// ---------------------------------------------------------------------------
// Group CRUD
// ---------------------------------------------------------------------------

/** Create a group (optionally nested under `parentId`), returning the new list + the new id. */
export function addGroup(
  groups: ExtensionFillRuleGroup[],
  label: string,
  parentId?: string,
): { groups: ExtensionFillRuleGroup[];
  id: string; } {
  const id = randomId();
  const group: ExtensionFillRuleGroup = {
    id,
    label,
    overrides: {},
    ...(parentId
      ? {
        parentId,
      }
      : {}),
  };
  return {
    groups: [...groups, group],
    id,
  };
}

/** Rename a group. */
export function renameGroup(
  groups: ExtensionFillRuleGroup[],
  id: string,
  label: string,
): ExtensionFillRuleGroup[] {
  return groups.map(group => (group.id === id
    ? {
      ...group,
      label,
    }
    : group));
}

/** Set one override value on a group. */
export function setGroupOverride<K extends OverrideKey>(
  groups: ExtensionFillRuleGroup[],
  id: string,
  key: K,
  value: OverrideValue<K>,
): ExtensionFillRuleGroup[] {
  return groups.map(group =>
    (group.id === id
      ? {
        ...group,
        overrides: {
          ...group.overrides,
          [key]: value,
        },
      }
      : group));
}

/** Remove one override from a group (the option becomes editable again on its member rules). */
export function clearGroupOverride(
  groups: ExtensionFillRuleGroup[],
  id: string,
  key: OverrideKey,
): ExtensionFillRuleGroup[] {
  return groups.map((group) => {
    if (group.id !== id) return group;
    const {
      [key]: _dropped, ...rest
    } = group.overrides;
    return {
      ...group,
      overrides: rest,
    };
  });
}

/**
 * Delete a group: promotes its child groups to top-level (`parentId` cleared) and detaches its direct
 * member rules (clears their `groupId`, keeping materialized values). Returns the new groups + rules.
 */
export function deleteGroup(
  groups: ExtensionFillRuleGroup[],
  rules: WebsiteExtensionFillRule[],
  id: string,
): { groups: ExtensionFillRuleGroup[];
  rules: WebsiteExtensionFillRule[]; } {
  const nextGroups = groups
    .filter(group => group.id !== id)
    .map((group) => {
      if (group.parentId !== id) return group;
      const {
        parentId: _dropped, ...rest
      } = group;
      return rest;
    });
  let nextRules = rules;
  for (const rule of rules) {
    if (rule.groupId === id) nextRules = removeRuleFromGroup(nextRules, rule.id);
  }
  return {
    groups: nextGroups,
    rules: nextRules,
  };
}

// ---------------------------------------------------------------------------
// Two-tier nesting guard
// ---------------------------------------------------------------------------

/** A group's depth: 1 for a top-level group, 2 for a nested one. */
export function groupDepth(groups: ExtensionFillRuleGroup[], id: string): number {
  return resolveGroupChain(groups, id).length;
}

/** Whether some group is a (direct) child of `parentId`. */
function hasChildren(groups: ExtensionFillRuleGroup[], parentId: string): boolean {
  return groups.some(group => group.parentId === parentId);
}

/**
 * Whether `childId` may be nested under `parentId` without exceeding two tiers or forming a cycle:
 * the parent must be top-level, the child must have no children of its own, and they must differ.
 */
export function canNest(
  groups: ExtensionFillRuleGroup[],
  childId: string,
  parentId: string,
): boolean {
  if (childId === parentId) return false;
  if (groupDepth(groups, parentId) !== 1) return false;
  if (hasChildren(groups, childId)) return false;
  return true;
}

/** Re-parent a group (or clear its parent when `parentId` is omitted), guarded by {@link canNest}. */
export function setGroupParent(
  groups: ExtensionFillRuleGroup[],
  id: string,
  parentId?: string,
): ExtensionFillRuleGroup[] {
  if (parentId && !canNest(groups, id, parentId)) return groups;
  return groups.map((group) => {
    if (group.id !== id) return group;
    const {
      parentId: _dropped, ...rest
    } = group;
    return parentId
      ? {
        ...rest,
        parentId,
      }
      : rest;
  });
}
