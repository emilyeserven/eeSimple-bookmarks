import { useMemo } from "react";

import { normalizeDomain } from "@eesimple/types";

import { useWebsites } from "./useWebsites";

/**
 * Resolve a website id to its normalized domain. Autofill and card-display rules reference websites
 * by domain string, not id, so the entity-scoped rule lists resolve `website.id → domain` before
 * filtering. Returns `undefined` while websites load or when no id is given.
 */
export function useWebsiteDomain(websiteId: string | undefined): string | undefined {
  const {
    data: websites,
  } = useWebsites();
  return useMemo(() => {
    if (!websiteId) return undefined;
    const domain = (websites ?? []).find(site => site.id === websiteId)?.domain;
    return domain ? normalizeDomain(domain) : undefined;
  }, [websites, websiteId]);
}
