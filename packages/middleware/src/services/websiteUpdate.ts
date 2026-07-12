import type { ExtensionFillRuleGroup, LabeledWebsite, ShortenedLink, SocialLink, UpdateWebsiteInput, WebsiteExtensionFillRule, WebsiteParamRule, WebsiteScanObservation } from "@eesimple/types";

/** The website columns an update can set without touching the slug/domain (which need a DB lookup). */
export interface WebsiteScalarPatch {
  siteName?: string;
  description?: string | null;
  shortenedLinks?: ShortenedLink[];
  paramRules?: WebsiteParamRule[];
  categoryId?: string | null;
  mediaTypeId?: string | null;
  socialLinks?: SocialLink[];
  labeledWebsites?: LabeledWebsite[];
  alternateNames?: string[];
  extensionFillRules?: WebsiteExtensionFillRule[];
  extensionFillRuleGroups?: ExtensionFillRuleGroup[];
  scanObservations?: WebsiteScanObservation[];
  redirectResolutionFailure?: boolean;
  scanUrlForIsbn?: boolean;
}

/** Canonical website domain: strip a leading `www.` and lowercase. */
export function normalizeWebsiteDomain(domain: string): string {
  return domain.replace(/^www\./i, "").toLowerCase();
}

/**
 * Would this update rename or move a built-in website? Built-ins keep their name and domain (only
 * their rule fields stay editable), so this guards the rename/move attempt before applying a patch.
 */
export function builtInWebsiteRenamedOrMoved(
  input: Pick<UpdateWebsiteInput, "siteName" | "domain">,
  existing: { siteName: string;
    domain: string; },
): boolean {
  const renames = input.siteName !== undefined && input.siteName.trim() !== existing.siteName;
  const moves = input.domain !== undefined && normalizeWebsiteDomain(input.domain) !== existing.domain;
  return renames || moves;
}

/**
 * Build the patch for all scalar website columns except `domain`/`slug` (those need a uniqueness
 * check + slug regeneration in the service). `!== undefined` vs. `in input` mirrors the field's
 * nullability: omitted = leave unchanged; explicit `null` = clear to the column default.
 */
export function buildWebsiteScalarPatch(input: UpdateWebsiteInput): WebsiteScalarPatch {
  const patch: WebsiteScalarPatch = {};
  if (input.siteName !== undefined) patch.siteName = input.siteName;
  if (input.description !== undefined) patch.description = input.description ?? null;
  // Rule fields stay editable even on built-ins (only rename/move/delete are blocked).
  if (input.shortenedLinks !== undefined) patch.shortenedLinks = input.shortenedLinks;
  if (input.paramRules !== undefined) patch.paramRules = input.paramRules;
  if ("categoryId" in input) patch.categoryId = input.categoryId ?? null;
  if ("mediaTypeId" in input) patch.mediaTypeId = input.mediaTypeId ?? null;
  if ("socialLinks" in input) patch.socialLinks = input.socialLinks ?? [];
  if ("labeledWebsites" in input) patch.labeledWebsites = input.labeledWebsites ?? [];
  if (input.alternateNames !== undefined) patch.alternateNames = input.alternateNames;
  if (input.extensionFillRules !== undefined) patch.extensionFillRules = input.extensionFillRules;
  if (input.extensionFillRuleGroups !== undefined) patch.extensionFillRuleGroups = input.extensionFillRuleGroups;
  if (input.scanObservations !== undefined) patch.scanObservations = input.scanObservations;
  if ("redirectResolutionFailure" in input) patch.redirectResolutionFailure = input.redirectResolutionFailure ?? false;
  if ("scanUrlForIsbn" in input) patch.scanUrlForIsbn = input.scanUrlForIsbn ?? false;
  return patch;
}
