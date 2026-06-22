import type { AutofillScopeType } from "../lib/autofillScope";

import { useCategories } from "./useCategories";
import { useCustomProperties } from "./useCustomProperties";
import { useMediaTypes } from "./useMediaTypes";
import { useTagBySlug } from "./useTags";
import { useWebsites } from "./useWebsites";
import { useYouTubeChannelBySlug } from "./useYouTubeChannels";

/** The scope prop spread onto `AutofillRulesList` (e.g. `{ categoryId }`). Empty when no scope. */
export interface AutofillScopeListProps {
  categoryId?: string;
  propertyId?: string;
  websiteId?: string;
  tagId?: string;
  mediaTypeId?: string;
  channelId?: string;
}

/** A resolved entity scope for the Settings → Autofill list: the filter prop + a chip label. */
export interface ResolvedAutofillScope {
  /** Whether a scope is active (a `scope` + `scopeSlug` were present in the URL). */
  active: boolean;
  /** Human label for the filter chip (e.g. "Recipes"). Undefined while the entity is still resolving. */
  label: string | undefined;
  listProps: AutofillScopeListProps;
}

/** The minimal entity slices `resolveAutofillScope` needs (the cached lists / resolved single rows). */
export interface AutofillScopeData {
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

const INACTIVE: ResolvedAutofillScope = {
  active: false,
  label: undefined,
  listProps: {},
};

/**
 * Pure mapping from the URL scope (`scope` + `scopeSlug`) to the matching `AutofillRulesList` filter
 * prop (entity id) and a display label. Mirrors `useAutofillScopeDefaults`'s slug resolution but
 * produces the *filter* shape rather than the create-prefill shape. Extracted from the hook so the
 * per-type branching is unit-testable without router/query context.
 */
export function resolveAutofillScope(
  scope: AutofillScopeType | undefined,
  scopeSlug: string | undefined,
  data: AutofillScopeData,
): ResolvedAutofillScope {
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
 * Resolves the URL scope of the Settings → Autofill listing to the matching `AutofillRulesList`
 * filter prop and a display label, from the cached entity lists.
 */
export function useAutofillScope(
  scope: AutofillScopeType | undefined,
  scopeSlug: string | undefined,
): ResolvedAutofillScope {
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

  return resolveAutofillScope(scope, scopeSlug, {
    categories: categories ?? [],
    properties: properties ?? [],
    websites: websites ?? [],
    mediaTypes: mediaTypes ?? [],
    tag,
    channel,
  });
}

/** Human-readable noun for each scope type, used in the filter chip. */
export const AUTOFILL_SCOPE_LABELS: Record<AutofillScopeType, string> = {
  "category": "category",
  "property": "property",
  "website": "website",
  "tag": "tag",
  "media-type": "media type",
  "channel": "channel",
};
