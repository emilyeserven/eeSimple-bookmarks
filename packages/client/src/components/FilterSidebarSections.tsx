import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, Category, CustomProperty, GenreMood, MediaType, PlaceType, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";
import type { ReactNode } from "react";

import { Fragment } from "react";

import { useTranslation } from "react-i18next";

import {
  PersonFilterSection,
  CategoryFilterSection,
  FillableFieldsFilterSection,
  LanguageUsageFilterSection,
  GenreMoodFilterSection,
  MediaSourceFilterSection,
  MediaTypeFilterSection,
  PlaceTypeFilterSection,
  PropertiesFilterSection,
  RelationshipTypeFilterSection,
  SectionsFilterSection,
  TagsFilterSection,
  WebsiteFilterSection,
  YouTubeChannelFilterSection,
} from "./FilterSidebarSectionRows";
import { resolvePropertiesVisibility } from "../lib/filterSections";
import { Separator } from "./ui/separator";

/** The filter sections themselves, with separators between adjacent groups. */
export function FilterSections({
  tree, enabledProperties, categories, mediaTypes, youtubeChannels, websites, relationshipTypes, people, placeTypes, genreMoods, bookmarks, search, onSearchChange,
  hasTags, hasProperties, hasSectionsFilter, hasCategoryFilter, hasMediaTypeFilter, hasChannelFilter, hasWebsiteFilter, hasRelationshipTypeFilter, hasPersonFilter, hasPlaceTypeFilter, hasGenreMoodFilter, hasMediaSourceFilter, hasFillableFieldsFilter,
  sectionFilter,
}: {
  tree: TagNode[];
  enabledProperties: CustomProperty[];
  categories?: Category[];
  mediaTypes?: MediaType[];
  youtubeChannels?: YouTubeChannel[];
  websites?: Website[];
  relationshipTypes?: RelationshipType[];
  people?: Person[];
  placeTypes?: PlaceType[];
  genreMoods?: GenreMood[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  hasTags: boolean;
  hasProperties: boolean;
  hasSectionsFilter: boolean;
  hasCategoryFilter: boolean;
  hasMediaTypeFilter: boolean;
  hasChannelFilter: boolean;
  hasWebsiteFilter: boolean;
  hasRelationshipTypeFilter: boolean;
  hasPersonFilter: boolean;
  hasPlaceTypeFilter: boolean;
  hasGenreMoodFilter: boolean;
  hasMediaSourceFilter: boolean;
  hasFillableFieldsFilter: boolean;
  sectionFilter?: string;
}) {
  const {
    t,
  } = useTranslation();
  const filter = (sectionFilter ?? "").toLowerCase().trim();
  const sectionMatch = (label: string) => !filter || label.toLowerCase().includes(filter);
  const sectionShown = (has: boolean, label: string) => has && sectionMatch(label);

  const {
    showProperties, propertyNameFilter,
  } = resolvePropertiesVisibility({
    filter,
    propertiesLabelMatch: sectionMatch(t("Properties")),
    hasProperties,
    enabledProperties,
  });

  return (
    <SeparatedSections
      sections={[
        {
          key: "tags",
          show: sectionShown(hasTags, t("Tags")),
          node: (
            <TagsFilterSection
              tree={tree}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "categories",
          show: sectionShown(hasCategoryFilter, t("Category")),
          node: (
            <CategoryFilterSection
              categories={categories}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "media-types",
          show: sectionShown(hasMediaTypeFilter, t("Media type")),
          node: (
            <MediaTypeFilterSection
              mediaTypes={mediaTypes}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "channels",
          show: sectionShown(hasChannelFilter, t("YouTube channel")),
          node: (
            <YouTubeChannelFilterSection
              youtubeChannels={youtubeChannels}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "websites",
          show: sectionShown(hasWebsiteFilter, t("Website")),
          node: (
            <WebsiteFilterSection
              websites={websites}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "relationship-types",
          show: sectionShown(hasRelationshipTypeFilter, t("Relationship type")),
          node: (
            <RelationshipTypeFilterSection
              relationshipTypes={relationshipTypes}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          // A self-managed facet (not in the FILTER_FACETS on-demand registry): its two vocabularies
          // are always-seeded built-ins and the section self-fetches them, so it is shown whenever it
          // has options and returns null otherwise.
          key: "language-usages",
          show: sectionShown(true, t("Language usage")),
          node: (
            <LanguageUsageFilterSection
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "people",
          show: sectionShown(hasPersonFilter, t("Person")),
          node: (
            <PersonFilterSection
              people={people}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "place-types",
          show: sectionShown(hasPlaceTypeFilter, t("Place type")),
          node: (
            <PlaceTypeFilterSection
              placeTypes={placeTypes}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "genre-moods",
          show: sectionShown(hasGenreMoodFilter, t("Genres & Moods")),
          node: (
            <GenreMoodFilterSection
              genreMoods={genreMoods}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "sections",
          show: sectionShown(hasSectionsFilter, t("Sections")),
          node: (
            <SectionsFilterSection
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "media-source",
          show: sectionShown(hasMediaSourceFilter, t("Media source")),
          node: (
            <MediaSourceFilterSection
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "fillable-fields",
          show: sectionShown(hasFillableFieldsFilter, t("Fillable fields")),
          node: (
            <FillableFieldsFilterSection
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "properties",
          show: showProperties,
          node: (
            <PropertiesFilterSection
              enabledProperties={enabledProperties}
              categories={categories}
              bookmarks={bookmarks}
              search={search}
              onSearchChange={onSearchChange}
              hasCategoryFilter={hasCategoryFilter}
              nameFilter={propertyNameFilter}
            />
          ),
        },
      ]}
    />
  );
}

interface FilterSectionEntry {
  key: string;
  show: boolean;
  node: ReactNode;
}

/** Render the shown sections in order, inserting a `<Separator />` before each one after the first. */
function SeparatedSections({
  sections,
}: {
  sections: FilterSectionEntry[];
}) {
  const shown = sections.filter(section => section.show);
  return (
    <>
      {shown.map((section, index) => (
        <Fragment key={section.key}>
          {index > 0 ? <Separator /> : null}
          {section.node}
        </Fragment>
      ))}
    </>
  );
}
