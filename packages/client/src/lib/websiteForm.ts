import type { ShortenedLink, WebsiteParamRule } from "@eesimple/types";

/** Local draft of a param rule, with params edited as a comma-separated string. */
export interface ParamRuleDraft {
  pathSuffix: string;
  matchMode: "suffix" | "contains";
  paramsText: string;
}

/** Normalize shortened-link drafts to the stored shape (lower-cased domains, blank expandTo → null). */
export function normalizeShortLinks(links: ShortenedLink[]): ShortenedLink[] {
  return links
    .map(link => ({
      domain: link.domain.trim().replace(/^www\./i, "").toLowerCase(),
      expandTo: link.expandTo && link.expandTo.trim() ? link.expandTo.trim() : null,
      keepShortened: link.keepShortened,
    }))
    .filter(link => link.domain.length > 0);
}

/** Normalize param-rule drafts to the stored shape, dropping fully-empty rows. */
export function normalizeRules(rules: ParamRuleDraft[]): WebsiteParamRule[] {
  return rules
    .map(rule => ({
      pathSuffix: rule.pathSuffix.trim(),
      matchMode: rule.matchMode,
      params: rule.paramsText.split(",").map(part => part.trim()).filter(Boolean),
    }))
    .filter(rule => rule.pathSuffix.length > 0 || rule.params.length > 0);
}
