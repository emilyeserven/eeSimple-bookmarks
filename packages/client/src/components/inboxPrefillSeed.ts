import type { AutofillRule, InboxItem, InboxPreFillDefaults, Website } from "@eesimple/types";

import { normalizeDomain } from "@eesimple/types";

import { applyAutofill } from "../lib/autofill";

/** Extract a bookmark URL's normalized host, or `null` if it can't be parsed. */
function hostOf(url: string): string | null {
  try {
    return normalizeDomain(new URL(url).hostname);
  }
  catch {
    return null;
  }
}

/**
 * Compute the taxonomy values an inbox item's per-row "Advanced" editor should start with, so the
 * user reviews/overrides what the matching system already knows instead of typing from scratch.
 *
 * Sources, by precedence:
 *  - **Category / media type** (single-valued): the item's existing `categoryId` (the import /
 *    newsletter default) wins, then the matched website's default, then the autofill rules. This
 *    mirrors the server's `pickApprovalCategoryId` ordering so the seeded value matches what approval
 *    would apply.
 *  - **Tags** (multi-valued): the union of the matched website's default tags and every matching
 *    autofill rule's tags.
 *
 * Authors / publisher have no rule/website source, so they stay empty. Pure — unit-tested directly.
 * (YouTube-channel defaults need an oEmbed scan and are merged in lazily by the row controller.)
 */
export function computeInboxPrefillSeed(
  item: InboxItem,
  {
    autofillRules,
    websites,
  }: {
    autofillRules: AutofillRule[];
    websites: Website[];
  },
): InboxPreFillDefaults {
  const url = item.url ?? "";
  const title = item.title ?? item.anchorText ?? "";

  const autofill = applyAutofill({
    url,
    title,
  }, autofillRules);

  const domain = url ? hostOf(url) : null;
  const website = domain ? websites.find(w => w.domain === domain) ?? null : null;

  const categoryId = item.categoryId ?? website?.category?.id ?? autofill.categoryId ?? undefined;
  const mediaTypeId = website?.mediaTypeId ?? autofill.mediaTypeId ?? undefined;
  const tagIds = [...new Set([...(website?.tagIds ?? []), ...autofill.tagIds])];

  return {
    categoryId,
    mediaTypeId,
    tagIds,
    authorIds: [],
    publisherId: undefined,
  };
}
