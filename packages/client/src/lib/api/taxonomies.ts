import type {
  Person,
  AutoFetchJobStatus,
  Book,
  BulkBookmarkResult,
  BulkDeleteResult,
  Category,
  CategoryPropertyDefaults,
  CreatePersonInput,
  SocialLink,
  CreateBookInput,
  CreateCategoryInput,
  CreateCustomPropertyInput,
  CreateMediaPropertyInput,
  CreateMovieInput,
  CreateTvShowInput,
  CreateEpisodeInput,
  CreateAlbumInput,
  CreateArtistInput,
  CreateTrackInput,
  CreateMediaTypeInput,
  CreateLanguageInput,
  CreatePlaceTypeInput,
  CreatePropertyGroupInput,
  CreateGroupInput,
  CreateGroupTypeInput,
  CreateRelationshipTypeInput,
  CreateTagInput,
  CreateWebsiteInput,
  CreateYouTubeChannelInput,
  CreateLocationChainInput,
  CreateLocationInput,
  SetLocationAncestorsInput,
  CustomProperty,
  Location,
  LocationLookupResult,
  LocationNode,
  Language,
  MediaProperty,
  MediaType,
  MediaTypeNode,
  Movie,
  TvShow,
  Episode,
  Album,
  Artist,
  Track,
  PlaceType,
  UpdateBookInput,
  UpdateLocationInput,
  UpdateMediaPropertyInput,
  UpdateMovieInput,
  UpdateTvShowInput,
  UpdateEpisodeInput,
  UpdateAlbumInput,
  UpdateArtistInput,
  UpdateTrackInput,
  UpdatePlaceTypeInput,
  PropertyGroup,
  Group,
  GroupType,
  RedirectFailureWebsite,
  RelationshipType,
  SocialMediaPlatform,
  Tag,
  TagNode,
  UpdatePersonInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
  UpdateCustomPropertyInput,
  UpdateMediaTypeInput,
  UpdateLanguageInput,
  UpdatePropertyGroupInput,
  UpdateGroupInput,
  UpdateGroupTypeInput,
  UpdateRelationshipTypeInput,
  UpdateTagInput,
  UpdateWebsiteInput,
  UpdateYouTubeChannelInput,
  Website,
  WebsiteLookup,
  WebsiteNode,
  YouTubeChannel,
} from "@eesimple/types";

import { createCrudApi, request, uploadImageFile } from "./client";
import { createTaxonomyImageApi } from "./taxonomyImages";

/** The success payload of a Plex "Autofetch from Plex" action (error sentinels become HTTP errors). */
export interface PlexAutofetchResult {
  status: "ok";
  /** Whether the linked item's poster was imported as the main image. */
  posterImported: boolean;
  /** Whether a Wikidata item matched (native/romanized names + Wikipedia links written). */
  wikidataMatched: boolean;
  /** The entity's (possibly renamed) slug, so callers can follow a rename. */
  slug: string | null;
}

/** POST the shared `${base}/:id/plex-autofetch` action for a Plex-backed media taxonomy. */
const plexAutofetch = (base: string) => (id: string) =>
  request<PlexAutofetchResult>(`${base}/${id}/plex-autofetch`, {
    method: "POST",
  });

export const peopleApi = {
  ...createCrudApi<Person, CreatePersonInput, UpdatePersonInput>("people"),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<{ imageUrl: string }>(`/people/${id}/image`, file),
  autoImage: (id: string, source: "website" | "biography" | "social", platform?: SocialMediaPlatform) =>
    request<{ imageUrl: string }>(`/people/${id}/image/auto`, {
      method: "POST",
      body: JSON.stringify({
        source,
        ...(platform
          ? {
            platform,
          }
          : {}),
      }),
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/people/${id}/image`, {
      method: "DELETE",
    }),
  adoptChannelImage: (id: string, channelId: string) =>
    request<{ imageUrl: string }>(`/people/${id}/image/from-channel`, {
      method: "POST",
      body: JSON.stringify({
        channelId,
      }),
    }),
  adoptWebsiteFavicon: (id: string, websiteId: string) =>
    request<{ imageUrl: string }>(`/people/${id}/image/from-website`, {
      method: "POST",
      body: JSON.stringify({
        websiteId,
      }),
    }),
  detectSocialLinks: (id: string) =>
    request<{ detected: SocialLink[] }>(`/people/${id}/social-links/detect`, {
      method: "POST",
    }),
};

export const tagsApi = {
  ...createCrudApi<Tag, CreateTagInput, UpdateTagInput>("tags"),
  tree: () => request<TagNode[]>("/tags/tree"),
  categories: (id: string) =>
    request<{ categoryIds: string[] }>(`/tags/${id}/categories`),
  setCategories: (id: string, categoryIds: string[]) =>
    request<{ categoryIds: string[] }>(`/tags/${id}/categories`, {
      method: "PUT",
      body: JSON.stringify({
        categoryIds,
      }),
    }),
};

export const websitesApi = {
  ...createCrudApi<Website, CreateWebsiteInput, UpdateWebsiteInput>("websites"),
  lookup: (url: string) =>
    request<WebsiteLookup>(`/websites/lookup?url=${encodeURIComponent(url)}`),
  redirectFailures: () =>
    request<RedirectFailureWebsite[]>("/websites/redirect-failures"),
  tree: () => request<WebsiteNode[]>("/websites/tree"),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<{ imageUrl: string }>(`/websites/${id}/image`, file),
  autoImage: (id: string) =>
    request<{ imageUrl: string }>(`/websites/${id}/image/auto`, {
      method: "POST",
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/websites/${id}/image`, {
      method: "DELETE",
    }),
  bulkUpdate: (ids: string[], patch: UpdateWebsiteInput) =>
    request<BulkBookmarkResult[]>("/websites/bulk", {
      method: "POST",
      body: JSON.stringify({
        ids,
        patch,
      }),
    }),
  bulkTags: (ids: string[], tagIds: string[], op: "add" | "remove") =>
    request<BulkBookmarkResult[]>("/websites/bulk-tags", {
      method: "POST",
      body: JSON.stringify({
        ids,
        tagIds,
        op,
      }),
    }),
};

export const mediaTypesApi = {
  ...createCrudApi<MediaType, CreateMediaTypeInput, UpdateMediaTypeInput>("media-types"),
  tree: () => request<MediaTypeNode[]>("/media-types/tree"),
};

export const languagesApi = createCrudApi<Language, CreateLanguageInput, UpdateLanguageInput>("languages");

export const locationsApi = {
  ...createCrudApi<Location, CreateLocationInput, UpdateLocationInput>("locations"),
  tree: () => request<LocationNode[]>("/locations/tree"),
  lookup: (query: string, source?: "wikidata") =>
    request<LocationLookupResult>(
      `/locations/lookup?q=${encodeURIComponent(query)}${source ? `&source=${source}` : ""}`,
    ),
  createChain: (input: CreateLocationChainInput) =>
    request<Location>("/locations/chain", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  setAncestors: (id: string, input: SetLocationAncestorsInput) =>
    request<Location>(`/locations/${id}/ancestors`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  refreshBoundary: (id: string) =>
    request<Location>(`/locations/${id}/refresh-boundary`, {
      method: "POST",
    }),
  refreshCoordinates: (id: string) =>
    request<Location>(`/locations/${id}/refresh-coordinates`, {
      method: "POST",
    }),
  autofillWikipediaLinks: (id: string) =>
    request<Location>(`/locations/${id}/autofill-wikipedia-links`, {
      method: "POST",
    }),
};

export const placeTypesApi = {
  ...createCrudApi<PlaceType, CreatePlaceTypeInput, UpdatePlaceTypeInput>("place-types"),
  // Override the generic remove so deletion can optionally reassign the place type's locations to
  // another place type (via the `reassignTo` query param) instead of orphaning them.
  remove: (id: string, reassignTo?: string) =>
    request<undefined>(
      `/place-types/${id}${reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ""}`,
      {
        method: "DELETE",
      },
    ),
};

export const propertyGroupsApi = createCrudApi<PropertyGroup, CreatePropertyGroupInput, UpdatePropertyGroupInput>("property-groups");

export const mediaPropertiesApi = createCrudApi<MediaProperty, CreateMediaPropertyInput, UpdateMediaPropertyInput>("media-properties");

export const booksApi = {
  ...createCrudApi<Book, CreateBookInput, UpdateBookInput>("books"),
  images: createTaxonomyImageApi("/books"),
};

export const moviesApi = {
  ...createCrudApi<Movie, CreateMovieInput, UpdateMovieInput>("movies"),
  images: createTaxonomyImageApi("/movies"),
  autofetch: plexAutofetch("/movies"),
};

export const tvShowsApi = {
  ...createCrudApi<TvShow, CreateTvShowInput, UpdateTvShowInput>("tv-shows"),
  images: createTaxonomyImageApi("/tv-shows"),
  autofetch: plexAutofetch("/tv-shows"),
};

export const episodesApi = {
  ...createCrudApi<Episode, CreateEpisodeInput, UpdateEpisodeInput>("episodes"),
  images: createTaxonomyImageApi("/episodes"),
  autofetch: plexAutofetch("/episodes"),
};

export const albumsApi = {
  ...createCrudApi<Album, CreateAlbumInput, UpdateAlbumInput>("albums"),
  images: createTaxonomyImageApi("/albums"),
  autofetch: plexAutofetch("/albums"),
};

export const artistsApi = {
  ...createCrudApi<Artist, CreateArtistInput, UpdateArtistInput>("artists"),
  images: createTaxonomyImageApi("/artists"),
  autofetch: plexAutofetch("/artists"),
};

export const tracksApi = {
  ...createCrudApi<Track, CreateTrackInput, UpdateTrackInput>("tracks"),
  images: createTaxonomyImageApi("/tracks"),
  autofetch: plexAutofetch("/tracks"),
};

export const relationshipTypesApi = createCrudApi<RelationshipType, CreateRelationshipTypeInput, UpdateRelationshipTypeInput>("relationship-types");

export const youtubeChannelsApi = {
  list: () => request<YouTubeChannel[]>("/youtube-channels"),
  create: (input: CreateYouTubeChannelInput) =>
    request<YouTubeChannel>("/youtube-channels", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateYouTubeChannelInput) =>
    request<YouTubeChannel>(`/youtube-channels/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/youtube-channels/${id}`, {
    method: "DELETE",
  }),
  bulkDelete: (ids: string[]) =>
    request<BulkDeleteResult[]>("/youtube-channels/bulk-delete", {
      method: "POST",
      body: JSON.stringify({
        ids,
      }),
    }),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<{ imageUrl: string }>(`/youtube-channels/${id}/image`, file),
  autoImage: (id: string) =>
    request<{ imageUrl: string }>(`/youtube-channels/${id}/image/auto`, {
      method: "POST",
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/youtube-channels/${id}/image`, {
      method: "DELETE",
    }),
  backfillImages: () =>
    request<AutoFetchJobStatus>("/youtube-channels/backfill-images", {
      method: "POST",
    }),
  backfillImagesStatus: () => request<AutoFetchJobStatus>("/youtube-channels/backfill-images/status"),
  missingImageCount: () => request<{ count: number }>("/youtube-channels/missing-image-count"),
};

export const customPropertiesApi = createCrudApi<CustomProperty, CreateCustomPropertyInput, UpdateCustomPropertyInput>("custom-properties");

export const groupsApi = createCrudApi<Group, CreateGroupInput, UpdateGroupInput>("groups");

export const groupTypesApi = createCrudApi<GroupType, CreateGroupTypeInput, UpdateGroupTypeInput>("group-types");

export const categoriesApi = {
  ...createCrudApi<Category, CreateCategoryInput, UpdateCategoryInput>("categories"),
  rootTags: (id: string) =>
    request<{ tagIds: string[] }>(`/categories/${id}/root-tags`),
  setRootTags: (id: string, tagIds: string[]) =>
    request<{ tagIds: string[] }>(`/categories/${id}/root-tags`, {
      method: "PUT",
      body: JSON.stringify({
        tagIds,
      }),
    }),
  defaults: (id: string) =>
    request<CategoryPropertyDefaults>(`/categories/${id}/defaults`),
  setDefaults: (id: string, input: UpdateCategoryDefaultsInput) =>
    request<CategoryPropertyDefaults>(`/categories/${id}/defaults`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};
