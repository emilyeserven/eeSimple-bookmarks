import type { AnyEntityDescriptor } from "./types";
import type { EntityRouteKind } from "../lib/entityRoutes";

import { albumDescriptor } from "./album";
import { autofillDescriptor } from "./autofillRule";
import { bookDescriptor } from "./book";
import { cardDisplayRuleDescriptor } from "./cardDisplayRule";
import { categoryDescriptor } from "./category";
import { episodeDescriptor } from "./episode";
import { genreMoodDescriptor } from "./genreMood";
import { groupDescriptor } from "./group";
import { groupTypeDescriptor } from "./groupType";
import { importRuleDescriptor } from "./importRule";
import { languageDescriptor } from "./language";
import { locationDescriptor } from "./location";
import { mediaPropertyDescriptor } from "./mediaProperty";
import { mediaTypeDescriptor } from "./mediaType";
import { movieDescriptor } from "./movie";
import { newsletterDescriptor } from "./newsletter";
import { personDescriptor } from "./person";
import { placeTypeDescriptor } from "./placeType";
import { podcastDescriptor } from "./podcast";
import { customPropertyDescriptor } from "./property";
import { propertyGroupDescriptor } from "./propertyGroup";
import { relationshipTypeDescriptor } from "./relationshipType";
import { savedFilterDescriptor } from "./savedFilter";
import { tagDescriptor } from "./tag";
import { trackDescriptor } from "./track";
import { tvShowDescriptor } from "./tvShow";
import { websiteDescriptor } from "./website";
import { youtubeChannelDescriptor } from "./youtubeChannel";

/**
 * The aggregate registry over every slug-routed entity's `EntityDescriptor` — the single source both
 * `ENTITY_ROUTES` (`lib/entityRoutes.ts`) and `ENTITY_PALETTE_CONFIGS` (`lib/entityPaletteRegistry.ts`)
 * derive from (#860). Adding a slug-routed entity means building its `*Descriptor` and adding one line
 * here; `satisfies Record<EntityRouteKind, …>` makes a missing kind fail `tsc`.
 *
 * Key order is load-bearing — `ENTITY_ROUTES` derives its match order from this object's
 * `Object.values` insertion order, so keep it in the historical route order.
 *
 * `satisfies` (not a type annotation) preserves each entry's precise inferred descriptor type.
 */
export const ENTITY_DESCRIPTORS = {
  "category": categoryDescriptor,
  "tag": tagDescriptor,
  "website": websiteDescriptor,
  "media-type": mediaTypeDescriptor,
  "genre-mood": genreMoodDescriptor,
  "language": languageDescriptor,
  "location": locationDescriptor,
  "place-type": placeTypeDescriptor,
  "youtube-channel": youtubeChannelDescriptor,
  "newsletter": newsletterDescriptor,
  "person": personDescriptor,
  "group": groupDescriptor,
  "group-type": groupTypeDescriptor,
  "property-group": propertyGroupDescriptor,
  "media-property": mediaPropertyDescriptor,
  "book": bookDescriptor,
  "podcast": podcastDescriptor,
  "movie": movieDescriptor,
  "tv-show": tvShowDescriptor,
  "episode": episodeDescriptor,
  "album": albumDescriptor,
  "track": trackDescriptor,
  "relationship-type": relationshipTypeDescriptor,
  "custom-property": customPropertyDescriptor,
  "autofill": autofillDescriptor,
  "import-rule": importRuleDescriptor,
  "saved-filter": savedFilterDescriptor,
  "card-display-rule": cardDisplayRuleDescriptor,
} satisfies Record<EntityRouteKind, AnyEntityDescriptor>;
