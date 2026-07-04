import type {
  BookmarkImageVisibility,
  BookmarkSort,
  CardFieldZones,
  CardZoneLayouts,
  ConditionTree,
  CustomProperty,
  HomepageSection,
  HomepageSectionImageLayout,
  ViewMode,
} from "@eesimple/types";

import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";

import { defaultCardFieldZones } from "../lib/bookmarkCardValues";

export interface HomepageSectionFormValues {
  title: string;
  description: string | null;
  conditions: ConditionTree;
  hideIfEmpty: boolean;
  columns: number;
  imageMode: string;
  imageLayout: HomepageSectionImageLayout;
  imageVisibility: BookmarkImageVisibility;
  viewMode: ViewMode;
  fieldZones: CardFieldZones;
  cardZoneLayouts: CardZoneLayouts;
  hideWebsiteForYouTube: boolean;
  sort: BookmarkSort | null;
  bookmarkLimit: number | null;
}

/**
 * The initial form values for a homepage section: each field falls back from the section being edited
 * to a sensible default (an empty/new section gets all defaults). The field-zone board seeds from the
 * Default card display rule's zones, then the standard defaults. Extracted as a pure builder so the
 * `??`/`?.` chain stays out of the component (keeping it under the complexity cap) and is testable.
 */
/** Content/behaviour fields: title, description, conditions, and the list-shaping knobs. */
function homepageSectionCoreDefaults(section: HomepageSection | undefined) {
  return {
    title: section?.title ?? "",
    description: section?.description ?? "",
    conditions: section?.conditions ?? emptyConditionTree(),
    hideIfEmpty: section?.hideIfEmpty ?? false,
    columns: section?.columns ?? 2,
    sort: section?.sort ?? null,
    bookmarkLimit: section?.bookmarkLimit ?? null,
  };
}

/** Card presentation fields: image mode/layout/visibility, view mode, and the field-zone board. */
function homepageSectionDisplayDefaults(
  section: HomepageSection | undefined,
  defaultZones: CardFieldZones | undefined,
  properties: CustomProperty[] | undefined,
) {
  return {
    imageMode: section?.imageMode ?? "natural",
    imageLayout: section?.imageLayout ?? "above",
    imageVisibility: section?.imageVisibility ?? "shown",
    viewMode: section?.viewMode ?? "cards",
    fieldZones: section?.fieldZones ?? defaultZones ?? defaultCardFieldZones(properties ?? []),
    cardZoneLayouts: section?.cardZoneLayouts ?? defaultCardZoneLayouts(),
    hideWebsiteForYouTube: section?.hideWebsiteForYouTube ?? false,
  };
}

export function buildHomepageSectionInitialValues(
  section: HomepageSection | undefined,
  defaultZones: CardFieldZones | undefined,
  properties: CustomProperty[] | undefined,
): HomepageSectionFormValues {
  return {
    ...homepageSectionCoreDefaults(section),
    ...homepageSectionDisplayDefaults(section, defaultZones, properties),
  };
}
