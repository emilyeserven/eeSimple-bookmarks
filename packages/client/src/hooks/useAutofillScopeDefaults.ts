import type { AutofillScopeDefaults } from "../lib/autofillPrefill";

import { useParams } from "@tanstack/react-router";

import { useCategories } from "./useCategories";
import { useCustomProperties } from "./useCustomProperties";
import { useMediaTypes } from "./useMediaTypes";
import { useTagBySlug } from "./useTags";
import { useWebsites } from "./useWebsites";
import { useYouTubeChannelBySlug } from "./useYouTubeChannels";

/**
 * Resolves the scope defaults for a new autofill rule from the current route. When the user is on a
 * category's / property's / website's / tag's / media type's / channel's autofill tab the slug is
 * still in the route path; we preselect that entity so the new rule shows up in the scoped list and
 * arrives pre-populated. Every field is undefined on other surfaces (e.g. `/autofill`).
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
  } = useTagBySlug(tagSlug ?? "");
  const {
    channel: preseedChannel,
  } = useYouTubeChannelBySlug(channelSlug ?? "");

  return {
    categoryId: categorySlug
      ? (categories ?? []).find(category => category.slug === categorySlug)?.id
      : undefined,
    propertyId: propertySlug
      ? (properties ?? []).find(p => p.slug === propertySlug)?.id
      : undefined,
    websiteDomain: websiteSlug
      ? (websites ?? []).find(site => site.slug === websiteSlug)?.domain
      : undefined,
    tagIds: tagSlug && preseedTag ? [preseedTag.id] : undefined,
    mediaTypeId: mediaTypeSlug
      ? (mediaTypes ?? []).find(mt => mt.slug === mediaTypeSlug)?.id
      : undefined,
    channelIds: channelSlug && preseedChannel ? [preseedChannel.id] : undefined,
  };
}
