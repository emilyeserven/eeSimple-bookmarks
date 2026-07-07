import type { AutofillListSearch } from "../lib/autofillScope";

import { useCategories } from "./useCategories";
import { useCustomProperties } from "./useCustomProperties";
import { useMediaTypes } from "./useMediaTypes";
import { useTags } from "./useTags";
import { useWebsites } from "./useWebsites";
import { useYouTubeChannels } from "./useYouTubeChannels";
import { NO_CATEGORY } from "../lib/autofillScope";

/** The filter props spread onto `AutofillRulesList` — one entity id per active facet. */
export interface AutofillScopeListProps {
  categoryId?: string;
  propertyId?: string;
  websiteId?: string;
  tagId?: string;
  mediaTypeId?: string;
  channelId?: string;
}

/** Resolved facet filters for the Settings → Autofill list: the list props + the "no category" flag. */
export interface ResolvedAutofillFacets {
  listProps: AutofillScopeListProps;
  /** True when the category facet is the "no category" sentinel (rules that set no category). */
  noCategory: boolean;
}

/** The minimal entity slices `resolveAutofillFacets` needs — the cached flat lists (id + slug). */
export interface AutofillFacetData {
  categories: readonly { id: string;
    slug: string; }[];
  properties: readonly { id: string;
    slug: string; }[];
  websites: readonly { id: string;
    slug: string; }[];
  mediaTypes: readonly { id: string;
    slug: string; }[];
  tags: readonly { id: string;
    slug: string; }[];
  channels: readonly { id: string;
    slug: string; }[];
}

/**
 * Pure mapping from the URL facet slugs to the matching `AutofillRulesList` filter props (entity ids).
 * Each facet resolves independently from the cached flat lists and the props combine (the list ANDs
 * them). An unresolved slug (e.g. still loading, or stale) simply contributes no filter. Extracted from
 * the hook so the per-facet branching is unit-testable without router/query context.
 */
export function resolveAutofillFacets(
  search: AutofillListSearch,
  data: AutofillFacetData,
): ResolvedAutofillFacets {
  const idForSlug = (list: readonly { id: string;
    slug: string; }[], slug: string | undefined): string | undefined =>
    slug ? list.find(item => item.slug === slug)?.id : undefined;

  const noCategory = search.category === NO_CATEGORY;
  const listProps: AutofillScopeListProps = {};

  const categoryId = noCategory ? undefined : idForSlug(data.categories, search.category);
  if (categoryId) listProps.categoryId = categoryId;
  const propertyId = idForSlug(data.properties, search.property);
  if (propertyId) listProps.propertyId = propertyId;
  const websiteId = idForSlug(data.websites, search.website);
  if (websiteId) listProps.websiteId = websiteId;
  const tagId = idForSlug(data.tags, search.tag);
  if (tagId) listProps.tagId = tagId;
  const mediaTypeId = idForSlug(data.mediaTypes, search.mediaType);
  if (mediaTypeId) listProps.mediaTypeId = mediaTypeId;
  const channelId = idForSlug(data.channels, search.channel);
  if (channelId) listProps.channelId = channelId;

  return {
    listProps,
    noCategory,
  };
}

/**
 * Resolves the URL facet filters of the Settings → Autofill listing to the matching `AutofillRulesList`
 * filter props, from the cached entity lists.
 */
export function useAutofillFacets(search: AutofillListSearch): ResolvedAutofillFacets {
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
  const {
    data: tags,
  } = useTags();
  const {
    data: channels,
  } = useYouTubeChannels();

  return resolveAutofillFacets(search, {
    categories: categories ?? [],
    properties: properties ?? [],
    websites: websites ?? [],
    mediaTypes: mediaTypes ?? [],
    tags: tags ?? [],
    channels: channels ?? [],
  });
}

/** One facet's `<FacetSelect>` options plus its loading flag. */
export interface AutofillFacetOptions {
  options: { value: string;
    label: string; }[];
  loading: boolean;
}

/** Per-entity option lists + loading flags for the autofill-rules listing filter sidebar. Bundles
 * the six entity-list hooks so the sidebar component depends on one hook instead of six. */
export interface AutofillFilterData {
  categories: AutofillFacetOptions;
  properties: AutofillFacetOptions;
  websites: AutofillFacetOptions;
  mediaTypes: AutofillFacetOptions;
  tags: AutofillFacetOptions;
  channels: AutofillFacetOptions;
}

export function useAutofillFilterData(): AutofillFilterData {
  const {
    data: categories = [], isLoading: categoriesLoading,
  } = useCategories();
  const {
    data: properties = [], isLoading: propertiesLoading,
  } = useCustomProperties();
  const {
    data: websites = [], isLoading: websitesLoading,
  } = useWebsites();
  const {
    data: mediaTypes = [], isLoading: mediaTypesLoading,
  } = useMediaTypes();
  const {
    data: tags = [], isLoading: tagsLoading,
  } = useTags();
  const {
    data: channels = [], isLoading: channelsLoading,
  } = useYouTubeChannels();

  return {
    categories: {
      loading: categoriesLoading,
      options: categories.map(category => ({
        value: category.slug,
        label: category.name,
      })),
    },
    properties: {
      loading: propertiesLoading,
      options: properties.map(property => ({
        value: property.slug,
        label: property.name,
      })),
    },
    websites: {
      loading: websitesLoading,
      options: websites.map(website => ({
        value: website.slug,
        label: website.siteName ?? website.domain,
      })),
    },
    mediaTypes: {
      loading: mediaTypesLoading,
      options: mediaTypes.filter(mediaType => !mediaType.hidden).map(mediaType => ({
        value: mediaType.slug,
        label: mediaType.name,
      })),
    },
    tags: {
      loading: tagsLoading,
      options: tags.map(tag => ({
        value: tag.slug,
        label: tag.name,
      })),
    },
    channels: {
      loading: channelsLoading,
      options: channels.map(channel => ({
        value: channel.slug,
        label: channel.name,
      })),
    },
  };
}
