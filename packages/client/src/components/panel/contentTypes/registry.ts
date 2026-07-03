// The panel's content-type registry array: it assembles each entity's per-type definition
// (view/edit components + list adapter, defined in ./<entity>) into the ordered array its
// consumers iterate over. The individual definitions are grouped behind two sub-barrels so this
// module — and `../contentTypes` — stay within the dependency cap.
import type { PanelContentTypeDef } from "./types";

import {
  personContentType,
  autofillContentType,
  cardDisplayRuleContentType,
  importRuleContentType,
  newsletterContentType,
  groupContentType,
  relationshipTypeContentType,
  savedFilterContentType,
} from "./peopleAndRuleContentTypes";
import {
  albumContentType,
  artistContentType,
  bookContentType,
  bookmarkContentType,
  categoryContentType,
  episodeContentType,
  genreMoodContentType,
  groupTypeContentType,
  languageContentType,
  locationContentType,
  mediaPropertyContentType,
  mediaTypeContentType,
  movieContentType,
  trackContentType,
  tvShowContentType,
  placeTypeContentType,
  propertyContentType,
  propertyGroupContentType,
  tagContentType,
  websiteContentType,
  youtubeChannelContentType,
} from "./taxonomyContentTypes";

/** Every content type the panel can browse, in tile/list display order. */
export const PANEL_CONTENT_TYPES: PanelContentTypeDef[] = [
  bookmarkContentType,
  tagContentType,
  categoryContentType,
  propertyContentType,
  propertyGroupContentType,
  websiteContentType,
  mediaTypeContentType,
  genreMoodContentType,
  languageContentType,
  locationContentType,
  placeTypeContentType,
  mediaPropertyContentType,
  bookContentType,
  movieContentType,
  tvShowContentType,
  episodeContentType,
  albumContentType,
  artistContentType,
  trackContentType,
  youtubeChannelContentType,
  newsletterContentType,
  personContentType,
  groupContentType,
  groupTypeContentType,
  relationshipTypeContentType,
  autofillContentType,
  cardDisplayRuleContentType,
  importRuleContentType,
  savedFilterContentType,
];
