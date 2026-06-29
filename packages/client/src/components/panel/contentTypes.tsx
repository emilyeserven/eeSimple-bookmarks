// This module is the panel's content-type registry: it assembles each entity's per-type definition
// (view/edit components + list adapter, defined in ./contentTypes/<entity>) into the exported
// registry array/lookup its consumers iterate over.
import type { PanelContentTypeDef } from "./contentTypes/types";
import type { DrawerContentType } from "@/lib/drawerSearch";

import { authorContentType } from "./contentTypes/author";
import { autofillContentType } from "./contentTypes/autofill";
import { bookmarkContentType } from "./contentTypes/bookmark";
import { cardDisplayRuleContentType } from "./contentTypes/cardDisplayRule";
import { categoryContentType } from "./contentTypes/category";
import { importRuleContentType } from "./contentTypes/importRule";
import { locationContentType } from "./contentTypes/location";
import { mediaTypeContentType } from "./contentTypes/mediaType";
import { newsletterContentType } from "./contentTypes/newsletter";
import { propertyContentType } from "./contentTypes/property";
import { propertyGroupContentType } from "./contentTypes/propertyGroup";
import { publisherContentType } from "./contentTypes/publisher";
import { relationshipTypeContentType } from "./contentTypes/relationshipType";
import { savedFilterContentType } from "./contentTypes/savedFilter";
import { tagContentType } from "./contentTypes/tag";
import { websiteContentType } from "./contentTypes/website";
import { youtubeChannelContentType } from "./contentTypes/youtubeChannel";

export type { PanelContentTypeDef, PanelListItem } from "./contentTypes/types";

/** Every content type the panel can browse, in tile/list display order. */
export const PANEL_CONTENT_TYPES: PanelContentTypeDef[] = [
  bookmarkContentType,
  tagContentType,
  categoryContentType,
  propertyContentType,
  propertyGroupContentType,
  websiteContentType,
  mediaTypeContentType,
  locationContentType,
  youtubeChannelContentType,
  newsletterContentType,
  authorContentType,
  publisherContentType,
  relationshipTypeContentType,
  autofillContentType,
  cardDisplayRuleContentType,
  importRuleContentType,
  savedFilterContentType,
];

/** Look up a content type's definition. */
export function getContentType(type: DrawerContentType): PanelContentTypeDef {
  const def = PANEL_CONTENT_TYPES.find(candidate => candidate.type === type);
  if (!def) throw new Error(`Unknown panel content type: ${type}`);
  return def;
}
