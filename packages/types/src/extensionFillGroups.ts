/**
 * Grouping layer over a website's extension "check & fill" rules (see `extensionFill.ts`). A
 * {@link ExtensionFillRuleGroup} names a set of rules that share overridden option values — e.g. a
 * "Courses" group whose rules all use the same Path match, or a group that fixes Target = Custom
 * property "Content Status" so each member rule only sets its own choice value. Stored as nullable
 * jsonb on `websites.extension_fill_rule_groups`, parallel to `extension_fill_rules`.
 *
 * The override values are **materialized** onto the member rules (a group edit rewrites its members'
 * concrete `target`/`pathMatch` fields — see the client `lib/extensionFillGroups.ts`), so the browser
 * extension and the fill-context service read rules exactly as before; a rule only carries an extra
 * `groupId`. An overridden option is shown read-only in that rule's editor.
 */

import type { EntityResolution, FillTarget, PathMatch, SectionFillEntryType } from "./extensionFill.js";
import type { TaxonomyDirectFieldKey, TaxonomyEntityAssociation, TaxonomyEntityWriteKey } from "./extensionFillTaxonomy.js";
import type { SocialMediaPlatform } from "./socialMedia.js";

/**
 * The scraping-layout sub-fields of a `sections` target, bundled into one overridable unit. These
 * grouping fields are mutually constrained (the engine's precedence in `cleanSectionsTarget`), so a
 * group overrides them together rather than piecemeal.
 */
export type SectionsLayoutOverride = Pick<
  Extract<FillTarget, { kind: "sections" }>,
  "container" | "header" | "itemName" | "itemUrl" | "sectionMatch" | "sectionHeaderSelector"
>;

/**
 * Every rule option a group can override, at the granularity of the editor controls. Path match and
 * every target discriminator are overridable; the per-rule extract pipeline (selector/read/filters/
 * transforms/split) is deliberately absent. The dotted keys mirror where the value lives on a rule.
 */
export const OVERRIDE_KEYS = [
  "pathMatch",
  "target.kind",
  "field.field",
  "customProperty.propertyId",
  "customProperty.subField",
  "customProperty.choiceValue",
  "taxonomy.taxonomy",
  "image.setMain",
  "taxonomyEntity.association",
  "taxonomyEntity.field",
  "taxonomyEntity.socialPlatform",
  "taxonomyDirect.association",
  "taxonomyDirect.resolve",
  "taxonomyDirect.field",
  "taxonomyDirect.socialPlatform",
  "sections.propertyId",
  "sections.entryType",
  "sections.layout",
] as const;
export type OverrideKey = typeof OVERRIDE_KEYS[number];

/**
 * A group's overridden option values, keyed by {@link OverrideKey}. Every key is optional — a group
 * overrides only the options it sets. The value type of each key matches the rule field it drives.
 */
export interface ExtensionFillOverrides {
  "pathMatch"?: PathMatch;
  "target.kind"?: FillTarget["kind"];
  "field.field"?: Extract<FillTarget, { kind: "field" }>["field"];
  "customProperty.propertyId"?: string;
  "customProperty.subField"?: "current" | "total";
  "customProperty.choiceValue"?: string;
  "taxonomy.taxonomy"?: Extract<FillTarget, { kind: "taxonomy" }>["taxonomy"];
  "image.setMain"?: boolean;
  "taxonomyEntity.association"?: TaxonomyEntityAssociation;
  "taxonomyEntity.field"?: TaxonomyEntityWriteKey;
  "taxonomyEntity.socialPlatform"?: SocialMediaPlatform;
  "taxonomyDirect.association"?: TaxonomyEntityAssociation;
  "taxonomyDirect.resolve"?: EntityResolution;
  "taxonomyDirect.field"?: TaxonomyDirectFieldKey;
  "taxonomyDirect.socialPlatform"?: SocialMediaPlatform;
  "sections.propertyId"?: string;
  "sections.entryType"?: SectionFillEntryType;
  "sections.layout"?: SectionsLayoutOverride;
}

/**
 * One group of a website's fill rules. `parentId` nests a group under one parent (max depth 2 —
 * enforced client-side); a rule in an inner group inherits both tiers' overrides. Group display order
 * is the array position (no `sortOrder`); rule order within a group is the rules-array order.
 */
export interface ExtensionFillRuleGroup {
  /** Stable uuid — drag + membership identity (`WebsiteExtensionFillRule.groupId` points here). */
  id: string;
  label: string;
  /** Parent group id for the second tier, or absent for a top-level group. */
  parentId?: string;
  /** The option values this group forces onto its member rules. */
  overrides: ExtensionFillOverrides;
}
