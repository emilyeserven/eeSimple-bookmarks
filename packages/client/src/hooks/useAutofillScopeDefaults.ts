import type { AutofillScopeDefaults } from "../lib/autofillPrefill";

import { useParams, useSearch } from "@tanstack/react-router";

import { useCategories } from "./useCategories";
import { useCustomProperties } from "./useCustomProperties";
import { useMediaTypes } from "./useMediaTypes";
import { useTagBySlug } from "./useTags";
import { useWebsites } from "./useWebsites";
import { useYouTubeChannelBySlug } from "./useYouTubeChannels";

/**
 * Resolves the scope defaults for a new autofill rule from the current route. When the user is on a
 * category's / property's / website's / tag's / media type's / channel's autofill tab the slug is
 * still in the route path; the Settings → Autofill page instead carries it in the URL search
 * (`?scope=…&scopeSlug=…`). Either way we preselect that entity so the new rule shows up in the
 * scoped list and arrives pre-populated. Every field is undefined on other surfaces (e.g. `/autofill`).
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
  }) as { scope?: string;
    scopeSlug?: string; };
  // Prefer the route-path slug; fall back to the Settings → Autofill `scope`/`scopeSlug` search pair.
  const slugFor = (kind: string, pathSlug: string | undefined): string | undefined =>
    pathSlug ?? (search.scope === kind ? search.scopeSlug : undefined);
  const effectiveCategorySlug = slugFor("category", categorySlug);
  const effectivePropertySlug = slugFor("property", propertySlug);
  const effectiveWebsiteSlug = slugFor("website", websiteSlug);
  const effectiveTagSlug = slugFor("tag", tagSlug);
  const effectiveMediaTypeSlug = slugFor("media-type", mediaTypeSlug);
  const effectiveChannelSlug = slugFor("channel", channelSlug);

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

  return {
    categoryId: effectiveCategorySlug
      ? (categories ?? []).find(category => category.slug === effectiveCategorySlug)?.id
      : undefined,
    propertyId: effectivePropertySlug
      ? (properties ?? []).find(p => p.slug === effectivePropertySlug)?.id
      : undefined,
    websiteDomain: effectiveWebsiteSlug
      ? (websites ?? []).find(site => site.slug === effectiveWebsiteSlug)?.domain
      : undefined,
    tagIds: effectiveTagSlug && preseedTag ? [preseedTag.id] : undefined,
    mediaTypeId: effectiveMediaTypeSlug
      ? (mediaTypes ?? []).find(mt => mt.slug === effectiveMediaTypeSlug)?.id
      : undefined,
    channelIds: effectiveChannelSlug && preseedChannel ? [preseedChannel.id] : undefined,
  };
}
