import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, Category, CustomProperty, MediaType, PlaceType, PropertyGroup, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";
import type { ReactNode } from "react";

import { Fragment } from "react";

import {
  PersonFilterSection,
  CategoryFilterSection,
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
  tree, enabledProperties, propertyGroups, categories, mediaTypes, youtubeChannels, websites, relationshipTypes, people, placeTypes, bookmarks, search, onSearchChange,
  hasTags, hasProperties, hasSectionsFilter, hasCategoryFilter, hasMediaTypeFilter, hasChannelFilter, hasWebsiteFilter, hasRelationshipTypeFilter, hasPersonFilter, hasPlaceTypeFilter,
  sectionFilter,
}: {
  tree: TagNode[];
  enabledProperties: CustomProperty[];
  propertyGroups?: PropertyGroup[];
  categories?: Category[];
  mediaTypes?: MediaType[];
  youtubeChannels?: YouTubeChannel[];
  websites?: Website[];
  relationshipTypes?: RelationshipType[];
  people?: Person[];
  placeTypes?: PlaceType[];
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
  sectionFilter?: string;
}) {
  const filter = (sectionFilter ?? "").toLowerCase().trim();
  const sectionMatch = (label: string) => !filter || label.toLowerCase().includes(filter);
  const sectionShown = (has: boolean, label: string) => has && sectionMatch(label);

  const {
    showProperties, propertyNameFilter,
  } = resolvePropertiesVisibility({
    filter,
    propertiesLabelMatch: sectionMatch("Properties"),
    hasProperties,
    enabledProperties,
  });

  return (
    <SeparatedSections
      sections={[
        {
          key: "tags",
          show: sectionShown(hasTags, "Tags"),
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
          show: sectionShown(hasCategoryFilter, "Category"),
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
          show: sectionShown(hasMediaTypeFilter, "Media type"),
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
          show: sectionShown(hasChannelFilter, "YouTube channel"),
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
          show: sectionShown(hasWebsiteFilter, "Website"),
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
          show: sectionShown(hasRelationshipTypeFilter, "Relationship type"),
          node: (
            <RelationshipTypeFilterSection
              relationshipTypes={relationshipTypes}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "people",
          show: sectionShown(hasPersonFilter, "Person"),
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
          show: sectionShown(hasPlaceTypeFilter, "Place type"),
          node: (
            <PlaceTypeFilterSection
              placeTypes={placeTypes}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "sections",
          show: sectionShown(hasSectionsFilter, "Sections"),
          node: (
            <SectionsFilterSection
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
              propertyGroups={propertyGroups}
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
