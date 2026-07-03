import type { TaxonomyName } from "./-appHeaderData";

import { useAlbumBySlug } from "@/hooks/useAlbums";
import { useArtistBySlug } from "@/hooks/useArtists";
import { useAutofillRuleBySlug } from "@/hooks/useAutofill";
import { useBookBySlug } from "@/hooks/useBooks";
import { useCardDisplayRuleBySlug } from "@/hooks/useCardDisplayRules";
import { usePropertyBySlug } from "@/hooks/useCustomProperties";
import { useEpisodeBySlug } from "@/hooks/useEpisodes";
import { useGroupBySlug } from "@/hooks/useGroups";
import { useGroupTypeBySlug } from "@/hooks/useGroupTypes";
import { useImportRuleBySlug } from "@/hooks/useImportRules";
import { useMediaPropertyBySlug } from "@/hooks/useMediaProperties";
import { useMovieBySlug } from "@/hooks/useMovies";
import { useNewsletterBySlug } from "@/hooks/useNewsletters";
import { usePersonBySlug } from "@/hooks/usePeople";
import { usePlaceTypeBySlug } from "@/hooks/usePlaceTypes";
import { usePropertyGroupBySlug } from "@/hooks/usePropertyGroups";
import { useRelationshipTypeBySlug } from "@/hooks/useRelationshipTypes";
import { useSavedFilterBySlug } from "@/hooks/useSavedFilters";
import { useTrackBySlug } from "@/hooks/useTracks";
import { useTvShowBySlug } from "@/hooks/useTvShows";

/** The per-prefix slugs the named-entity hooks resolve. The caller computes these (it already owns
 * `slugFor`), so this module stays free of that dependency. An empty slug short-circuits its hook. */
export interface TaxonomyNameSlugs {
  newsletter: string;
  person: string;
  group: string;
  groupType: string;
  placeType: string;
  propertyGroup: string;
  mediaProperty: string;
  book: string;
  movie: string;
  tvShow: string;
  episode: string;
  album: string;
  artist: string;
  track: string;
  relationshipType: string;
  property: string;
  autofill: string;
  importRule: string;
  savedFilter: string;
  cardDisplayRule: string;
}

/**
 * Resolves the `List → Name` crumb names for the slug-routed entities the header only *names* (it
 * never needs their raw record for a pin / add-child control). The four entities that the pin /
 * add-child controls do consume (category, website, media type, channel) resolve in
 * `useTaxonomyCrumbData` instead. Each by-slug hook short-circuits on an empty slug, so only the
 * entity whose page is active actually looks anything up.
 */
export function useTaxonomyNameMap(
  slugs: TaxonomyNameSlugs,
): Record<string, TaxonomyName | undefined> {
  const {
    newsletter,
  } = useNewsletterBySlug(slugs.newsletter);
  const {
    person,
  } = usePersonBySlug(slugs.person);
  const {
    group,
  } = useGroupBySlug(slugs.group);
  const {
    groupType,
  } = useGroupTypeBySlug(slugs.groupType);
  const {
    placeType,
  } = usePlaceTypeBySlug(slugs.placeType);
  const {
    propertyGroup,
  } = usePropertyGroupBySlug(slugs.propertyGroup);
  const {
    mediaProperty,
  } = useMediaPropertyBySlug(slugs.mediaProperty);
  const {
    book,
  } = useBookBySlug(slugs.book);
  const {
    movie,
  } = useMovieBySlug(slugs.movie);
  const {
    tvShow,
  } = useTvShowBySlug(slugs.tvShow);
  const {
    episode,
  } = useEpisodeBySlug(slugs.episode);
  const {
    album,
  } = useAlbumBySlug(slugs.album);
  const {
    artist,
  } = useArtistBySlug(slugs.artist);
  const {
    track,
  } = useTrackBySlug(slugs.track);
  const {
    relationshipType,
  } = useRelationshipTypeBySlug(slugs.relationshipType);
  const {
    property,
  } = usePropertyBySlug(slugs.property);
  const {
    rule,
  } = useAutofillRuleBySlug(slugs.autofill);
  const {
    rule: importRule,
  } = useImportRuleBySlug(slugs.importRule);
  const {
    savedFilter,
  } = useSavedFilterBySlug(slugs.savedFilter);
  const {
    rule: cardDisplayRule,
  } = useCardDisplayRuleBySlug(slugs.cardDisplayRule);

  return {
    "/taxonomies/newsletters": {
      name: newsletter?.name,
    },
    "/taxonomies/people": {
      name: person?.name,
      romanized: person?.romanizedName,
    },
    "/taxonomies/groups": {
      name: group?.name,
      romanized: group?.romanizedName,
    },
    "/taxonomies/group-types": {
      name: groupType?.name,
    },
    "/taxonomies/place-types": {
      name: placeType?.name,
    },
    "/taxonomies/property-groups": {
      name: propertyGroup?.name,
    },
    "/taxonomies/media-properties": {
      name: mediaProperty?.name,
    },
    "/taxonomies/books": {
      name: book?.name,
    },
    "/taxonomies/movies": {
      name: movie?.name,
    },
    "/taxonomies/tv-shows": {
      name: tvShow?.name,
    },
    "/taxonomies/episodes": {
      name: episode?.name,
    },
    "/taxonomies/albums": {
      name: album?.name,
    },
    "/taxonomies/artists": {
      name: artist?.name,
    },
    "/taxonomies/tracks": {
      name: track?.name,
    },
    "/taxonomies/relationship-types": {
      name: relationshipType?.name,
    },
    "/custom-properties": {
      name: property?.name,
    },
    "/autofill": {
      name: rule?.name,
    },
    "/import-rules": {
      name: importRule?.name,
    },
    "/saved-filters": {
      name: savedFilter?.name,
    },
    "/card-display-rules": {
      name: cardDisplayRule?.name,
    },
  };
}
