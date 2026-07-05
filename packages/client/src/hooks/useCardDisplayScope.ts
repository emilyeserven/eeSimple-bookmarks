import type { CardDisplayScopeType } from "../lib/cardDisplayScope";

import i18n from "../i18n";
import { useCategories } from "./useCategories";
import { useCustomProperties } from "./useCustomProperties";
import { useMediaTypes } from "./useMediaTypes";
import { useTagBySlug } from "./useTags";
import { useWebsites } from "./useWebsites";
import { useYouTubeChannelBySlug } from "./useYouTubeChannels";

/** The scope prop spread onto `CardDisplayRulesList` (e.g. `{ categoryId }`). Empty when no scope. */
export interface CardDisplayScopeListProps {
  categoryId?: string;
  propertyId?: string;
  websiteId?: string;
  tagId?: string;
  mediaTypeId?: string;
  channelId?: string;
}

/** A resolved entity scope for the Settings → Card Display Rules list: the filter prop + a chip label. */
export interface ResolvedCardDisplayScope {
  /** Whether a scope is active (a `scope` + `scopeSlug` were present in the URL). */
  active: boolean;
  /** Human label for the filter chip (e.g. "Recipes"). Undefined while the entity is still resolving. */
  label: string | undefined;
  listProps: CardDisplayScopeListProps;
}

/** The minimal entity slices `resolveCardDisplayScope` needs (the cached lists / resolved single rows). */
export interface CardDisplayScopeData {
  categories: readonly { id: string;
    slug: string;
    name: string; }[];
  properties: readonly { id: string;
    slug: string;
    name: string; }[];
  websites: readonly { id: string;
    slug: string;
    siteName: string; }[];
  mediaTypes: readonly { id: string;
    slug: string;
    name: string; }[];
  tag: { id: string;
    name: string; } | undefined;
  channel: { id: string;
    name: string; } | undefined;
}

const INACTIVE: ResolvedCardDisplayScope = {
  active: false,
  label: undefined,
  listProps: {},
};

/**
 * Pure mapping from the URL scope (`scope` + `scopeSlug`) to the matching `CardDisplayRulesList`
 * filter prop (entity id) and a display label. `CardDisplayRulesList` resolves the website id to its
 * domain and the property id to its value kind internally, so this only needs the raw entity id.
 * Extracted from the hook so the per-type branching is unit-testable without router/query context.
 */
export function resolveCardDisplayScope(
  scope: CardDisplayScopeType | undefined,
  scopeSlug: string | undefined,
  data: CardDisplayScopeData,
): ResolvedCardDisplayScope {
  if (!scope || !scopeSlug) return INACTIVE;

  switch (scope) {
    case "category": {
      const entity = data.categories.find(c => c.slug === scopeSlug);
      return {
        active: true,
        label: entity?.name,
        listProps: {
          categoryId: entity?.id,
        },
      };
    }
    case "property": {
      const entity = data.properties.find(p => p.slug === scopeSlug);
      return {
        active: true,
        label: entity?.name,
        listProps: {
          propertyId: entity?.id,
        },
      };
    }
    case "website": {
      const entity = data.websites.find(w => w.slug === scopeSlug);
      return {
        active: true,
        label: entity?.siteName,
        listProps: {
          websiteId: entity?.id,
        },
      };
    }
    case "media-type": {
      const entity = data.mediaTypes.find(m => m.slug === scopeSlug);
      return {
        active: true,
        label: entity?.name,
        listProps: {
          mediaTypeId: entity?.id,
        },
      };
    }
    case "tag":
      return {
        active: true,
        label: data.tag?.name,
        listProps: {
          tagId: data.tag?.id,
        },
      };
    case "channel":
      return {
        active: true,
        label: data.channel?.name,
        listProps: {
          channelId: data.channel?.id,
        },
      };
  }
}

/**
 * Resolves the URL scope of the Settings → Card Display Rules listing to the matching
 * `CardDisplayRulesList` filter prop and a display label, from the cached entity lists.
 */
export function useCardDisplayScope(
  scope: CardDisplayScopeType | undefined,
  scopeSlug: string | undefined,
): ResolvedCardDisplayScope {
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  // Safe to call unconditionally (return undefined for an empty slug).
  const {
    tag,
  } = useTagBySlug(scope === "tag" ? scopeSlug ?? "" : "");
  const {
    channel,
  } = useYouTubeChannelBySlug(scope === "channel" ? scopeSlug ?? "" : "");

  return resolveCardDisplayScope(scope, scopeSlug, {
    categories: categories ?? [],
    properties: properties ?? [],
    websites: websites ?? [],
    mediaTypes: mediaTypes ?? [],
    tag,
    channel,
  });
}

/** Human-readable noun for each scope type, used in the filter chip. */
export const CARD_DISPLAY_SCOPE_LABELS: Record<CardDisplayScopeType, string> = {
  "category": i18n.t("category"),
  "property": i18n.t("property"),
  "website": i18n.t("website"),
  "tag": i18n.t("tag"),
  "media-type": i18n.t("media type"),
  "channel": i18n.t("channel"),
};
