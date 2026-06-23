import type { TreeComboboxOption } from "./TreeMultiCombobox";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Author, Bookmark, Category, CustomProperty, MediaType, PropertyGroup, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";
import type { ReactNode } from "react";

import { Fragment } from "react";

import { ChevronDown, Globe, MonitorPlay, Share2, TriangleAlert } from "lucide-react";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import { FacetChips, FacetPresenceToggle } from "./FilterFacetControls";
import { MultiCombobox } from "./MultiCombobox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Separator } from "./ui/separator";
import {
  withAuthors,
  withBooleanFilter,
  withCategories,
  withDateTimeFilter,
  withMediaTypes,
  withNumberFilter,
  withPresenceFilter,
  withRelationshipTypes,
  withTagPresence,
  withTags,
  withWebsitePresence,
  withWebsites,
  withYouTubeChannelPresence,
  withYouTubeChannels,
} from "../lib/bookmarkSearch";

/** The filter sections themselves, with separators between adjacent groups. */
export function FilterSections({
  tree, enabledProperties, propertyGroups, categories, mediaTypes, youtubeChannels, websites, relationshipTypes, authors, bookmarks, search, onSearchChange,
  hasTags, hasProperties, hasCategoryFilter, hasMediaTypeFilter, hasChannelFilter, hasWebsiteFilter, hasRelationshipTypeFilter, hasAuthorFilter,
}: {
  tree: TagNode[];
  enabledProperties: CustomProperty[];
  propertyGroups?: PropertyGroup[];
  categories?: Category[];
  mediaTypes?: MediaType[];
  youtubeChannels?: YouTubeChannel[];
  websites?: Website[];
  relationshipTypes?: RelationshipType[];
  authors?: Author[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  hasTags: boolean;
  hasProperties: boolean;
  hasCategoryFilter: boolean;
  hasMediaTypeFilter: boolean;
  hasChannelFilter: boolean;
  hasWebsiteFilter: boolean;
  hasRelationshipTypeFilter: boolean;
  hasAuthorFilter: boolean;
}) {
  return (
    <SeparatedSections
      sections={[
        {
          key: "tags",
          show: hasTags,
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
          show: hasCategoryFilter,
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
          show: hasMediaTypeFilter,
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
          show: hasChannelFilter,
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
          show: hasWebsiteFilter,
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
          show: hasRelationshipTypeFilter,
          node: (
            <RelationshipTypeFilterSection
              relationshipTypes={relationshipTypes}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "authors",
          show: hasAuthorFilter,
          node: (
            <AuthorFilterSection
              authors={authors}
              search={search}
              onSearchChange={onSearchChange}
            />
          ),
        },
        {
          key: "properties",
          show: hasProperties,
          node: (
            <PropertiesFilterSection
              enabledProperties={enabledProperties}
              propertyGroups={propertyGroups}
              categories={categories}
              bookmarks={bookmarks}
              search={search}
              onSearchChange={onSearchChange}
              hasCategoryFilter={hasCategoryFilter}
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

function tagNodesToOptions(nodes: TagNode[]): TreeComboboxOption[] {
  return nodes.map(n => ({
    value: n.id,
    label: n.name,
    children: tagNodesToOptions(n.children),
  }));
}

/** Tiered-tag filter: a presence toggle plus a multi-select tree combobox, both driving `search`. */
function TagsFilterSection({
  tree, search, onSearchChange,
}: {
  tree: TagNode[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const selectedTags = search.tags ?? [];
  const tagFilterActive = selectedTags.length > 0 || search.tagPresence !== undefined;

  return (
    <Collapsible
      defaultOpen
      className="group/tags space-y-3"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger
          className="
            flex items-center gap-1.5 text-sm font-semibold
            hover:text-foreground
          "
        >
          <ChevronDown
            className="
              size-3.5 shrink-0 transition-transform
              group-data-[state=open]/tags:rotate-180
            "
          />
          Tags
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.tagPresence}
          onChange={mode => onSearchChange(withTagPresence(search, mode))}
          hasLabel="Has tags"
          missingLabel="No tags"
        />
      </div>

      <CollapsibleContent className="space-y-3">
        {search.tagPresence !== "missing"
          ? (
            <TreeMultiCombobox
              options={tagNodesToOptions(tree)}
              values={selectedTags}
              onValuesChange={ids => onSearchChange(withTags(search, ids))}
              placeholder="All tags"
              searchPlaceholder="Search tags…"
              emptyText="No tags found."
              aria-label="Filter by tag"
            />
          )
          : null}

        {tagFilterActive
          ? (
            <button
              type="button"
              onClick={() => onSearchChange(withTags(withTagPresence(search, undefined), []))}
              className="
                text-xs text-primary
                hover:underline
              "
            >
              Reset
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select category filter; only rendered on the overall Bookmarks page. */
function CategoryFilterSection({
  categories, search, onSearchChange,
}: {
  categories?: Category[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const categoryOptions = (categories ?? []).map(category => ({
    value: category.id,
    label: category.name,
  }));
  const selectedCategories = search.categories ?? [];

  return (
    <Collapsible
      defaultOpen
      className="group/category space-y-3"
    >
      <CollapsibleTrigger
        className="
          flex items-center gap-1.5 text-sm font-semibold
          hover:text-foreground
        "
      >
        <ChevronDown
          className="
            size-3.5 shrink-0 transition-transform
            group-data-[state=open]/category:rotate-180
          "
        />
        Category
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <MultiCombobox
          options={categoryOptions}
          values={selectedCategories}
          onValuesChange={ids => onSearchChange(withCategories(search, ids))}
          placeholder="All categories"
          aria-label="Filter by category"
        />
        {selectedCategories.length > 0
          ? (
            <button
              type="button"
              className="
                text-xs text-primary
                hover:underline
              "
              onClick={() => onSearchChange(withCategories(search, []))}
            >
              Reset
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

function toMediaTypeTree(flat: MediaType[]): TreeComboboxOption[] {
  const roots = flat.filter(m => m.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder);
  return roots.map(root => ({
    value: root.id,
    label: root.name,
    children: flat
      .filter(m => m.parentId === root.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(child => ({
        value: child.id,
        label: child.name,
      })),
  }));
}

/** Multi-select media-type filter with expandable parent groups; rendered wherever media types exist. */
function MediaTypeFilterSection({
  mediaTypes, search, onSearchChange,
}: {
  mediaTypes?: MediaType[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const options = toMediaTypeTree(mediaTypes ?? []);
  const selected = search.mediaTypes ?? [];

  return (
    <Collapsible
      defaultOpen
      className="group/media-type space-y-3"
    >
      <CollapsibleTrigger
        className="
          flex items-center gap-1.5 text-sm font-semibold
          hover:text-foreground
        "
      >
        <ChevronDown
          className="
            size-3.5 shrink-0 transition-transform
            group-data-[state=open]/media-type:rotate-180
          "
        />
        Media type
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <TreeMultiCombobox
          options={options}
          values={selected}
          onValuesChange={ids => onSearchChange(withMediaTypes(search, ids))}
          placeholder="All media types"
          searchPlaceholder="Search media types…"
          emptyText="No media types found."
          aria-label="Filter by media type"
        />
        {selected.length > 0
          ? (
            <button
              type="button"
              className="
                text-xs text-primary
                hover:underline
              "
              onClick={() => onSearchChange(withMediaTypes(search, []))}
            >
              Reset
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select YouTube-channel filter; rendered wherever channels exist. */
function YouTubeChannelFilterSection({
  youtubeChannels, search, onSearchChange,
}: {
  youtubeChannels?: YouTubeChannel[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const options = (youtubeChannels ?? []).map(channel => ({
    value: channel.id,
    label: channel.name,
    icon: channel.imageUrl
      ? (
        <img
          src={channel.imageUrl}
          alt=""
          className="size-4 shrink-0 rounded-full object-cover"
        />
      )
      : <MonitorPlay className="size-4 shrink-0 text-muted-foreground" />,
  }));
  const selected = search.youtubeChannels ?? [];
  const filterActive = selected.length > 0 || search.youtubeChannelPresence !== undefined;

  return (
    <Collapsible
      defaultOpen
      className="group/channel space-y-3"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger
          className="
            flex items-center gap-1.5 text-sm font-semibold
            hover:text-foreground
          "
        >
          <ChevronDown
            className="
              size-3.5 shrink-0 transition-transform
              group-data-[state=open]/channel:rotate-180
            "
          />
          YouTube channel
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.youtubeChannelPresence}
          onChange={mode => onSearchChange(withYouTubeChannelPresence(search, mode))}
          hasLabel="Has value"
          missingLabel="No value"
        />
      </div>
      <CollapsibleContent className="space-y-3">
        {search.youtubeChannelPresence !== "missing"
          ? (
            <>
              <MultiCombobox
                options={options}
                values={selected}
                onValuesChange={ids => onSearchChange(withYouTubeChannels(search, ids))}
                placeholder="All channels"
                aria-label="Filter by YouTube channel"
              />
              <FacetChips
                options={options}
                values={selected}
                onValuesChange={ids => onSearchChange(withYouTubeChannels(search, ids))}
              />
            </>
          )
          : null}
        {filterActive
          ? (
            <button
              type="button"
              className="
                text-xs text-primary
                hover:underline
              "
              onClick={() => onSearchChange(withYouTubeChannelPresence(withYouTubeChannels(search, []), undefined))}
            >
              Reset
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select website filter with favicons; rendered wherever websites exist. */
function WebsiteFilterSection({
  websites, search, onSearchChange,
}: {
  websites?: Website[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const options = (websites ?? []).map(website => ({
    value: website.id,
    label: website.siteName,
    icon: website.imageUrl
      ? (
        <img
          src={website.imageUrl}
          alt=""
          className="size-4 shrink-0 rounded-sm object-contain"
        />
      )
      : <Globe className="size-4 shrink-0 text-muted-foreground" />,
  }));
  const selected = search.websites ?? [];
  const filterActive = selected.length > 0 || search.websitePresence !== undefined;

  return (
    <Collapsible
      defaultOpen
      className="group/website space-y-3"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger
          className="
            flex items-center gap-1.5 text-sm font-semibold
            hover:text-foreground
          "
        >
          <ChevronDown
            className="
              size-3.5 shrink-0 transition-transform
              group-data-[state=open]/website:rotate-180
            "
          />
          Website
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.websitePresence}
          onChange={mode => onSearchChange(withWebsitePresence(search, mode))}
          hasLabel="Has value"
          missingLabel="No value"
        />
      </div>
      <CollapsibleContent className="space-y-3">
        {search.websitePresence !== "missing"
          ? (
            <>
              <MultiCombobox
                options={options}
                values={selected}
                onValuesChange={ids => onSearchChange(withWebsites(search, ids))}
                placeholder="All websites"
                searchPlaceholder="Search websites…"
                emptyText="No websites found."
                aria-label="Filter by website"
              />
              <FacetChips
                options={options}
                values={selected}
                onValuesChange={ids => onSearchChange(withWebsites(search, ids))}
              />
            </>
          )
          : null}
        {filterActive
          ? (
            <button
              type="button"
              className="
                text-xs text-primary
                hover:underline
              "
              onClick={() => onSearchChange(withWebsitePresence(withWebsites(search, []), undefined))}
            >
              Reset
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select relationship-type filter; rendered wherever relationship types exist. */
function RelationshipTypeFilterSection({
  relationshipTypes, search, onSearchChange,
}: {
  relationshipTypes?: RelationshipType[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const options = (relationshipTypes ?? []).map(rt => ({
    value: rt.id,
    label: rt.name,
    icon: <Share2 className="size-4 shrink-0 text-muted-foreground" />,
  }));
  const selected = search.relationshipTypes ?? [];

  return (
    <Collapsible
      defaultOpen
      className="group/relationship-type space-y-3"
    >
      <CollapsibleTrigger
        className="
          flex items-center gap-1.5 text-sm font-semibold
          hover:text-foreground
        "
      >
        <ChevronDown
          className="
            size-3.5 shrink-0 transition-transform
            group-data-[state=open]/relationship-type:rotate-180
          "
        />
        Relationship type
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <MultiCombobox
          options={options}
          values={selected}
          onValuesChange={ids => onSearchChange(withRelationshipTypes(search, ids))}
          placeholder="All relationship types"
          searchPlaceholder="Search relationship types…"
          emptyText="No relationship types found."
          aria-label="Filter by relationship type"
        />
        {selected.length > 0
          ? (
            <button
              type="button"
              className="
                text-xs text-primary
                hover:underline
              "
              onClick={() => onSearchChange(withRelationshipTypes(search, []))}
            >
              Reset
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select author filter; rendered wherever authors exist. */
function AuthorFilterSection({
  authors, search, onSearchChange,
}: {
  authors?: Author[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const options = (authors ?? []).map(author => ({
    value: author.id,
    label: author.name,
  }));
  const selected = search.authors ?? [];

  return (
    <Collapsible
      defaultOpen
      className="group/author space-y-3"
    >
      <CollapsibleTrigger
        className="
          flex items-center gap-1.5 text-sm font-semibold
          hover:text-foreground
        "
      >
        <ChevronDown
          className="
            size-3.5 shrink-0 transition-transform
            group-data-[state=open]/author:rotate-180
          "
        />
        Author
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <MultiCombobox
          options={options}
          values={selected}
          onValuesChange={ids => onSearchChange(withAuthors(search, ids))}
          placeholder="All authors"
          searchPlaceholder="Search authors…"
          emptyText="No authors found."
          aria-label="Filter by author"
        />
        {selected.length > 0
          ? (
            <button
              type="button"
              className="
                text-xs text-primary
                hover:underline
              "
              onClick={() => onSearchChange(withAuthors(search, []))}
            >
              Reset
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Custom-property filters plus a warning for properties with no category assignment. */
function PropertiesFilterSection({
  enabledProperties, propertyGroups, categories, bookmarks, search, onSearchChange, hasCategoryFilter,
}: {
  enabledProperties: CustomProperty[];
  propertyGroups?: PropertyGroup[];
  categories?: Category[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  hasCategoryFilter: boolean;
}) {
  const selectedCategories = search.categories ?? [];
  // A property assigned to no category is almost certainly orphaned; flag it as an error.
  const unassignedProperties = hasCategoryFilter
    ? enabledProperties.filter(property => property.categoryIds.length === 0)
    : [];

  const numberFilterChange = (propertyId: string, range: [number, number] | undefined) =>
    onSearchChange(withNumberFilter(search, propertyId, range));
  const booleanFilterChange = (propertyId: string, value: boolean | undefined) =>
    onSearchChange(withBooleanFilter(search, propertyId, value));
  const dateTimeFilterChange = (propertyId: string, range: [string | null, string | null] | undefined) =>
    onSearchChange(withDateTimeFilter(search, propertyId, range));
  const presenceFilterChange = (propertyId: string, mode: "has" | "missing" | undefined) =>
    onSearchChange(withPresenceFilter(search, propertyId, mode));
  const propertyReset = (propertyId: string) =>
    onSearchChange(
      withDateTimeFilter(
        withNumberFilter(
          withBooleanFilter(
            withPresenceFilter(search, propertyId, undefined),
            propertyId,
            undefined,
          ),
          propertyId,
          undefined,
        ),
        propertyId,
        undefined,
      ),
    );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Properties</h2>
      <CustomPropertyFilters
        properties={enabledProperties}
        propertyGroups={propertyGroups}
        categories={categories}
        selectedCategoryIds={selectedCategories}
        bookmarks={bookmarks}
        numberValues={search.num ?? {}}
        booleanValues={search.bool ?? {}}
        dateTimeValues={search.date ?? {}}
        presenceValues={search.presence ?? {}}
        onNumberFilterChange={numberFilterChange}
        onBooleanFilterChange={booleanFilterChange}
        onDateTimeFilterChange={dateTimeFilterChange}
        onPresenceFilterChange={presenceFilterChange}
        onPropertyReset={propertyReset}
      />
      {unassignedProperties.length > 0
        ? (
          <>
            <Separator className="my-3" />
            <div className="space-y-1 text-xs text-destructive">
              <p className="flex items-center gap-1.5 font-medium">
                <TriangleAlert className="size-3.5 shrink-0" />
                {unassignedProperties.length === 1
                  ? "1 property isn't assigned to a category"
                  : `${unassignedProperties.length} properties aren't assigned to a category`}
              </p>
              <p>{unassignedProperties.map(property => property.name).join(", ")}</p>
            </div>
          </>
        )
        : null}
    </div>
  );
}
