import type { AutofillRule, ConditionNode } from "@eesimple/types";

import { normalizeDomain } from "@eesimple/types";

/** True when the rule sets a value for `propertyId` via any of its custom-property value arrays. */
export function ruleSetsProperty(rule: AutofillRule, propertyId: string): boolean {
  return rule.numberValues.some(value => value.propertyId === propertyId)
    || rule.booleanValues.some(value => value.propertyId === propertyId)
    || rule.dateTimeValues.some(value => value.propertyId === propertyId);
}

/** True when the rule applies `tagId` to a bookmark. */
export function ruleSetsTag(rule: AutofillRule, tagId: string): boolean {
  return rule.tagIds.includes(tagId);
}

/** True when the rule sets `mediaTypeId` on matching bookmarks. */
export function ruleSetsMediaType(rule: AutofillRule, mediaTypeId: string): boolean {
  return rule.setMediaTypeId === mediaTypeId;
}

/** True when any Website condition in the rule's tree references `domain` (already normalized). */
export function ruleTargetsWebsite(rule: AutofillRule, domain: string): boolean {
  const visit = (node: ConditionNode): boolean => {
    if (node.type === "website") return node.domains.some(d => normalizeDomain(d) === domain);
    if (node.type === "group") return node.children.some(visit);
    return false;
  };
  return visit(rule.conditions);
}

/** True when any youtube-channel condition in the rule's tree references `channelId`. */
export function ruleTargetsYoutubeChannel(rule: AutofillRule, channelId: string): boolean {
  const visit = (node: ConditionNode): boolean => {
    if (node.type === "youtube-channel") return node.channelIds.includes(channelId);
    if (node.type === "group") return node.children.some(visit);
    return false;
  };
  return visit(rule.conditions);
}
