import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, LocationNode } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import {
  LocationAlternateNamesEditField,
  LocationAncestorsEditField,
  LocationCoordinatesEditField,
  LocationCountryCodeEditField,
  LocationDescriptionEditField,
  LocationGenreMoodsEditField,
  LocationGeoLookupEditField,
  LocationLabeledWebsitesEditField,
  LocationMapUrlEditField,
  LocationNameEditField,
  LocationNamesEditField,
  LocationOfficialLinkEditField,
  LocationParentEditField,
  LocationPlaceTypeEditField,
  LocationPlusCodeEditField,
  LocationPrimaryLanguageEditField,
  LocationTagsEditField,
  LocationUsesWikidataEditField,
  LocationWikipediaLinksEditField,
} from "../LocationGeneralForm";
import { LocationGeneralFormProvider } from "../LocationGeneralFormContext";
import {
  LocationBookmarkCountView,
  LocationChildrenCountView,
  LocationCoordinatesView,
  LocationCountryView,
  LocationCreatedView,
  LocationDescriptionView,
  LocationHierarchyView,
  LocationMapUrlView,
  LocationMapView,
  LocationNamesView,
  LocationOfficialLinkView,
  LocationParentView,
  LocationPlaceTypeView,
  LocationPrimaryLanguageView,
  LocationSlugView,
  LocationWikipediaLinksView,
} from "./locationViews";

import { useDeleteLocation, useLocationById, useLocationBySlug } from "@/hooks/useLocations";

/**
 * The location workbench's field registry (#1106 layout editor). The former single `general` composite
 * (view + edit + map) is now **atomized** into per-row {@link WorkbenchField}s (#1191, following the
 * bookmark #1163 reference) so an operator can rearrange each sub-field in Settings → Display → Page
 * Layouts. The mode picks the `view`/`edit` renderer, so view/edit parity is by construction: an
 * edit-only row (Name, geocode lookup, Uses-Wikidata, plus code, ancestors, alternate names, tags,
 * labeled websites, genres & moods) drops in view; a view-only row (Slug, Children count, Bookmarks,
 * Created, Map) drops in edit. `hierarchy` stays view-only. Authored as an exhaustive
 * `Record<LocationFieldKey, …>` so a key without a renderer fails `tsc`.
 *
 * The shared-`useAppForm` controller behind the edit rows is instantiated once by
 * {@link LocationGeneralFormProvider}, mounted by the generic `editFormProvider` seam on
 * `EntityEditView` (see `sharedFormFieldKeys` / `editFormProvider` below).
 */
type LocationFieldKey
  = | "name"
    | "slug"
    | "primaryLanguage"
    | "names"
    | "description"
    | "geoLookup"
    | "coordinates"
    | "mapUrl"
    | "usesWikidataCoordinates"
    | "plusCode"
    | "placeType"
    | "countryCode"
    | "officialLink"
    | "wikipediaLinks"
    | "parent"
    | "ancestors"
    | "childrenCount"
    | "alternateNames"
    | "tags"
    | "labeledWebsites"
    | "genreMoods"
    | "bookmarkCount"
    | "created"
    | "map"
    | "hierarchy"
    | "autofillRules";

const locationFields = {
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: () => <LocationNameEditField />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: LocationSlugView,
  },
  primaryLanguage: {
    key: "primaryLanguage",
    label: i18n.t("Primary language"),
    view: LocationPrimaryLanguageView,
    edit: () => <LocationPrimaryLanguageEditField />,
  },
  names: {
    key: "names",
    label: i18n.t("Names"),
    view: LocationNamesView,
    edit: ({
      entity,
    }) => <LocationNamesEditField node={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: LocationDescriptionView,
    edit: () => <LocationDescriptionEditField />,
  },
  geoLookup: {
    key: "geoLookup",
    label: i18n.t("Geocoding lookup"),
    edit: () => <LocationGeoLookupEditField />,
  },
  coordinates: {
    key: "coordinates",
    label: i18n.t("Coordinates"),
    view: LocationCoordinatesView,
    edit: () => <LocationCoordinatesEditField />,
  },
  mapUrl: {
    key: "mapUrl",
    label: i18n.t("Map URL"),
    view: LocationMapUrlView,
    edit: () => <LocationMapUrlEditField />,
  },
  usesWikidataCoordinates: {
    key: "usesWikidataCoordinates",
    label: i18n.t("Uses Wikidata for coordinates"),
    edit: () => <LocationUsesWikidataEditField />,
  },
  plusCode: {
    key: "plusCode",
    label: i18n.t("Plus code"),
    edit: () => <LocationPlusCodeEditField />,
  },
  placeType: {
    key: "placeType",
    label: i18n.t("Place type"),
    view: LocationPlaceTypeView,
    edit: () => <LocationPlaceTypeEditField />,
  },
  countryCode: {
    key: "countryCode",
    label: i18n.t("Country"),
    view: LocationCountryView,
    edit: () => <LocationCountryCodeEditField />,
  },
  officialLink: {
    key: "officialLink",
    label: i18n.t("Official link"),
    view: LocationOfficialLinkView,
    edit: () => <LocationOfficialLinkEditField />,
  },
  wikipediaLinks: {
    key: "wikipediaLinks",
    label: i18n.t("Wikipedia links"),
    view: LocationWikipediaLinksView,
    edit: () => <LocationWikipediaLinksEditField />,
  },
  parent: {
    key: "parent",
    label: i18n.t("Parent"),
    view: LocationParentView,
    edit: () => <LocationParentEditField />,
  },
  ancestors: {
    key: "ancestors",
    label: i18n.t("Ancestors"),
    edit: ({
      entity,
    }) => <LocationAncestorsEditField node={entity} />,
  },
  childrenCount: {
    key: "childrenCount",
    label: i18n.t("Children"),
    view: LocationChildrenCountView,
  },
  alternateNames: {
    key: "alternateNames",
    label: i18n.t("Alternate names"),
    edit: () => <LocationAlternateNamesEditField />,
  },
  tags: {
    key: "tags",
    label: i18n.t("Tags"),
    edit: () => <LocationTagsEditField />,
  },
  labeledWebsites: {
    key: "labeledWebsites",
    label: i18n.t("Websites"),
    edit: ({
      entity,
    }) => <LocationLabeledWebsitesEditField node={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => <LocationGenreMoodsEditField node={entity} />,
  },
  bookmarkCount: {
    key: "bookmarkCount",
    label: i18n.t("Bookmarks"),
    view: LocationBookmarkCountView,
  },
  created: {
    key: "created",
    label: i18n.t("Created"),
    view: LocationCreatedView,
  },
  map: {
    key: "map",
    label: i18n.t("Map"),
    view: LocationMapView,
  },
  hierarchy: {
    key: "hierarchy",
    label: i18n.t("Hierarchy"),
    view: LocationHierarchyView,
  },
  autofillRules: {
    key: "autofillRules",
    label: i18n.t("Autofill Rules"),
    view: ({
      entity,
    }) => (
      <AutofillRulesList
        locationId={entity.id}
        query=""
      />
    ),
    edit: ({
      entity,
    }) => (
      <AutofillRulesList
        locationId={entity.id}
        query=""
      />
    ),
  },
} satisfies Record<LocationFieldKey, WorkbenchField<LocationNode>>;

/**
 * The code-defined default layout — the General tab is one untitled section holding the atomized rows
 * in a unified order (the mode drops the fields it can't render), plus the unchanged Hierarchy /
 * Autofill tabs.
 */
const LOCATION_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: [
          "name",
          "slug",
          "primaryLanguage",
          "names",
          "description",
          "geoLookup",
          "coordinates",
          "mapUrl",
          "usesWikidataCoordinates",
          "plusCode",
          "placeType",
          "countryCode",
          "officialLink",
          "wikipediaLinks",
          "parent",
          "ancestors",
          "childrenCount",
          "alternateNames",
          "tags",
          "labeledWebsites",
          "genreMoods",
          "bookmarkCount",
          "created",
          "map",
        ] satisfies LocationFieldKey[],
      }],
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      sections: [{
        key: "hierarchy",
        fields: ["hierarchy"] satisfies LocationFieldKey[],
      }],
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      sections: [{
        key: "autofill",
        fields: ["autofillRules"] satisfies LocationFieldKey[],
      }],
    },
  ],
};

/**
 * The General-tab edit fields backed by the **shared** `useLocationGeneralForm` controller (everything
 * except the self-contained `names` / `genreMoods` sections). `EntityEditView` wraps the edit body in
 * {@link LocationGeneralFormProvider} when the active tab hosts any of these.
 */
const LOCATION_SHARED_FORM_FIELD_KEYS = new Set<string>([
  "name",
  "primaryLanguage",
  "description",
  "geoLookup",
  "coordinates",
  "mapUrl",
  "usesWikidataCoordinates",
  "plusCode",
  "placeType",
  "countryCode",
  "officialLink",
  "wikipediaLinks",
  "parent",
  "ancestors",
  "alternateNames",
  "tags",
  "labeledWebsites",
] satisfies LocationFieldKey[]);

/** Single source of truth for a location's tabbed view/edit UI (main pane routes + right panel). */
export const locationWorkbench: EntityWorkbench<LocationNode> = {
  useBySlug: (slug) => {
    const {
      location, isLoading,
    } = useLocationBySlug(slug);
    return {
      entity: location,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      location, isLoading, error,
    } = useLocationById(id);
    return {
      entity: location,
      isLoading,
      error,
    };
  },
  name: node => node.name,
  isBuiltIn: () => false,
  canDelete: () => true,
  useDelete: () => {
    const mutation = useDeleteLocation();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Location not found."),
  navAriaLabel: i18n.t("Location sections"),
  listingPath: "/taxonomies/locations",
  getSlug: location => location.slug,
  layoutKind: "location",
  fields: locationFields,
  defaultLayout: LOCATION_DEFAULT_LAYOUT,
  sharedFormFieldKeys: LOCATION_SHARED_FORM_FIELD_KEYS,
  editFormProvider: ({
    entity, children,
  }) => <LocationGeneralFormProvider node={entity}>{children}</LocationGeneralFormProvider>,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to carry the code-only `group` nav metadata (the "Rules" More dropdown on the
  // edit strip), re-attached by tab key in `deriveWorkbenchTabs`.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
    },
  ],
};
