import type { AutofillScopeDefaults } from "../lib/autofillPrefill";
import type { AutofillListSearch } from "../lib/autofillScope";

import { useParams, useSearch } from "@tanstack/react-router";

import { useCategories } from "./useCategories";
import { useCustomProperties } from "./useCustomProperties";
import { useMediaTypes } from "./useMediaTypes";
import { useTagBySlug } from "./useTags";
import { useWebsites } from "./useWebsites";
import { useYouTubeChannelBySlug } from "./useYouTubeChannels";
import { resolveAutofillScopeDefaults } from "../lib/autofillPrefill";
import { NO_CATEGORY } from "../lib/autofillScope";

/**
 * Resolves the scope defaults for a new autofill rule from the current route. When the user is on a
 * category's / property's / website's / tag's / media type's / channel's autofill tab the slug is
 * still in the route path; the Settings → Autofill page instead carries it in the URL search as a
 * per-facet slug (`?website=…`, `?tag=…`, …). Either way we preselect that entity so the new rule
 * shows up in the filtered list and arrives pre-populated. Every field is undefined on other surfaces
 * (e.g. `/autofill`).
 */
export function useAutofillScopeDefaults(): AutofillScopeDefaults {
  const {
    categorySlug,
    propertySlug,
    websiteSlug,
    tagSlug,
    mediaTypeSlug,
    channelSlug,
  } = useParams({
    strict: false,
  });
  const search = useSearch({
    strict: false,
  }) as Partial<AutofillListSearch>;
  // Prefer the route-path slug; fall back to the Settings → Autofill per-facet search slug.
  // The `none` category sentinel is a filter ("sets no category"), not an entity to preselect.
  const facetCategory = search.category === NO_CATEGORY ? undefined : search.category;
  const effectiveCategorySlug = categorySlug ?? facetCategory;
  const effectivePropertySlug = propertySlug ?? search.property;
  const effectiveWebsiteSlug = websiteSlug ?? search.website;
  const effectiveTagSlug = tagSlug ?? search.tag;
  const effectiveMediaTypeSlug = mediaTypeSlug ?? search.mediaType;
  const effectiveChannelSlug = channelSlug ?? search.channel;

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
  // useTagBySlug / useYouTubeChannelBySlug are safe to call unconditionally (return undefined when slug is empty).
  const {
    tag: preseedTag,
  } = useTagBySlug(effectiveTagSlug ?? "");
  const {
    channel: preseedChannel,
  } = useYouTubeChannelBySlug(effectiveChannelSlug ?? "");

  return resolveAutofillScopeDefaults(
    {
      category: effectiveCategorySlug,
      property: effectivePropertySlug,
      website: effectiveWebsiteSlug,
      tag: effectiveTagSlug,
      mediaType: effectiveMediaTypeSlug,
      channel: effectiveChannelSlug,
    },
    {
      categories: categories ?? [],
      properties: properties ?? [],
      websites: websites ?? [],
      mediaTypes: mediaTypes ?? [],
      tagId: preseedTag?.id,
      channelId: preseedChannel?.id,
    },
  );
}
