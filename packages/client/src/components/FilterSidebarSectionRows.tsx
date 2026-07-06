import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, Category, CustomProperty, GenreMood, MediaType, PlaceType, PropertyGroup, RelationshipType, SectionEntryType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { SECTION_ENTRY_TYPE_LABELS, SECTION_ENTRY_TYPES } from "@eesimple/types";
import { Captions, ChevronDown, Drama, Globe, Languages, MapPin, MonitorPlay, Share2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import { FacetChips, FacetPresenceToggle } from "./FilterFacetControls";
import { MultiCombobox } from "./MultiCombobox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { useLanguages } from "../hooks/useLanguages";
import { useLanguageUsageLevels } from "../hooks/useLanguageUsageLevels";
import { mediaTypeNodesToOptions } from "../lib/comboboxOptions";
import { sortLanguagesFavoritesFirst } from "../lib/languageOptions";
import { buildMediaTypeTree } from "../lib/mediaTypeTree";
import { tagNodesToOptions } from "../lib/tagTree";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Separator } from "./ui/separator";
import {
  withPeople,
  withBooleanFilter,
  withCategories,
  withChoicesFilter,
  withDateTimeFilter,
  withGenreMoodPresence,
  withGenreMoods,
  withMediaTypes,
  withNumberFilter,
  withLanguageUsageLanguages,
  withLanguageUsageLevels,
  withPlaceTypePresence,
  withPlaceTypes,
  withPresenceFilter,
  withRelationshipTypes,
  withSectionTypes,
  withSectionsPresence,
  withTagPresence,
  withTags,
  withWebsitePresence,
  withWebsites,
  withYouTubeChannelPresence,
  withYouTubeChannels,
} from "../lib/bookmarkSearch";

/** Tiered-tag filter: a presence toggle plus a multi-select tree combobox, both driving `search`. */
export function TagsFilterSection({
  tree, search, onSearchChange,
}: {
  tree: TagNode[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
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
          {t("Tags")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.tagPresence}
          onChange={mode => onSearchChange(withTagPresence(search, mode))}
          hasLabel={t("Has tags")}
          missingLabel={t("No tags")}
        />
      </div>

      <CollapsibleContent className="space-y-3">
        {search.tagPresence !== "missing"
          ? (
            <TreeMultiCombobox
              options={tagNodesToOptions(tree)}
              values={selectedTags}
              onValuesChange={ids => onSearchChange(withTags(search, ids))}
              placeholder={t("All tags")}
              searchPlaceholder={t("Search tags…")}
              emptyText={t("No tags found.")}
              aria-label={t("Filter by tag")}
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
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select category filter; only rendered on the overall Bookmarks page. */
export function CategoryFilterSection({
  categories, search, onSearchChange,
}: {
  categories?: Category[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const categoryOptions = (categories ?? []).map(category => ({
    value: category.id,
    label: category.name,
    names: category.names,
  }));
  const selectedCategories = search.categories ?? [];
  const allSelected = categoryOptions.length > 0 && selectedCategories.length === categoryOptions.length;

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
        {t("Category")}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <MultiCombobox
          options={categoryOptions}
          values={selectedCategories}
          onValuesChange={ids => onSearchChange(withCategories(search, ids))}
          placeholder={t("All categories")}
          aria-label={t("Filter by category")}
        />
        {categoryOptions.length > 0 || selectedCategories.length > 0
          ? (
            <div className="flex items-center gap-3">
              {!allSelected
                ? (
                  <button
                    type="button"
                    className="
                      text-xs text-primary
                      hover:underline
                    "
                    onClick={() => onSearchChange(withCategories(search, categoryOptions.map(option => option.value)))}
                  >
                    {t("Select all")}
                  </button>
                )
                : null}
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
                    {t("Reset")}
                  </button>
                )
                : null}
            </div>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select media-type filter with expandable parent groups; rendered wherever media types exist. */
export function MediaTypeFilterSection({
  mediaTypes, search, onSearchChange,
}: {
  mediaTypes?: MediaType[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const options = mediaTypeNodesToOptions(buildMediaTypeTree(mediaTypes ?? []));
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
        {t("Media type")}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <TreeMultiCombobox
          options={options}
          values={selected}
          onValuesChange={ids => onSearchChange(withMediaTypes(search, ids))}
          placeholder={t("All media types")}
          searchPlaceholder={t("Search media types…")}
          emptyText={t("No media types found.")}
          aria-label={t("Filter by media type")}
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
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select YouTube-channel filter; rendered wherever channels exist. */
export function YouTubeChannelFilterSection({
  youtubeChannels, search, onSearchChange,
}: {
  youtubeChannels?: YouTubeChannel[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
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
          {t("YouTube channel")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.youtubeChannelPresence}
          onChange={mode => onSearchChange(withYouTubeChannelPresence(search, mode))}
          hasLabel={t("Has value")}
          missingLabel={t("No value")}
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
                placeholder={t("All channels")}
                aria-label={t("Filter by YouTube channel")}
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
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Multi-select place-type filter; rendered wherever locations carry a place type. A bookmark can
 * carry several locations, so this is an "any match" filter (like Tags) rather than a 1:1 id
 * comparison — options are keyed by the place type's normalized `slug`, matching how
 * `BookmarkLocation.placeType` is compared server-side.
 */
export function PlaceTypeFilterSection({
  placeTypes, search, onSearchChange,
}: {
  placeTypes?: PlaceType[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const options = (placeTypes ?? []).map(placeType => ({
    value: placeType.slug,
    label: placeType.name,
    icon: <MapPin className="size-4 shrink-0 text-muted-foreground" />,
  }));
  const selected = search.placeTypes ?? [];
  const filterActive = selected.length > 0 || search.placeTypePresence !== undefined;

  return (
    <Collapsible
      defaultOpen
      className="group/place-type space-y-3"
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
              group-data-[state=open]/place-type:rotate-180
            "
          />
          {t("Place type")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.placeTypePresence}
          onChange={mode => onSearchChange(withPlaceTypePresence(search, mode))}
          hasLabel={t("Has place type")}
          missingLabel={t("No place type")}
        />
      </div>
      <CollapsibleContent className="space-y-3">
        {search.placeTypePresence !== "missing"
          ? (
            <>
              <MultiCombobox
                options={options}
                values={selected}
                onValuesChange={ids => onSearchChange(withPlaceTypes(search, ids))}
                placeholder={t("All place types")}
                aria-label={t("Filter by place type")}
              />
              <FacetChips
                options={options}
                values={selected}
                onValuesChange={ids => onSearchChange(withPlaceTypes(search, ids))}
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
              onClick={() => onSearchChange(withPlaceTypePresence(withPlaceTypes(search, []), undefined))}
            >
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select Genres & Moods filter ("any match"), with a presence toggle. */
export function GenreMoodFilterSection({
  genreMoods, search, onSearchChange,
}: {
  genreMoods?: GenreMood[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const options = (genreMoods ?? []).map(genreMood => ({
    value: genreMood.id,
    label: genreMood.name,
    names: genreMood.names,
    icon: <Drama className="size-4 shrink-0 text-muted-foreground" />,
  }));
  const selected = search.genreMoods ?? [];
  const filterActive = selected.length > 0 || search.genreMoodPresence !== undefined;

  return (
    <Collapsible
      defaultOpen
      className="group/genre-mood space-y-3"
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
              group-data-[state=open]/genre-mood:rotate-180
            "
          />
          {t("Genres & Moods")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.genreMoodPresence}
          onChange={mode => onSearchChange(withGenreMoodPresence(search, mode))}
          hasLabel={t("Has any")}
          missingLabel={t("Has none")}
        />
      </div>
      <CollapsibleContent className="space-y-3">
        {search.genreMoodPresence !== "missing"
          ? (
            <>
              <MultiCombobox
                options={options}
                values={selected}
                onValuesChange={ids => onSearchChange(withGenreMoods(search, ids))}
                placeholder={t("All Genres & Moods")}
                aria-label={t("Filter by Genres & Moods")}
              />
              <FacetChips
                options={options}
                values={selected}
                onValuesChange={ids => onSearchChange(withGenreMoods(search, ids))}
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
              onClick={() => onSearchChange(withGenreMoodPresence(withGenreMoods(search, []), undefined))}
            >
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select website filter with favicons; rendered wherever websites exist. */
export function WebsiteFilterSection({
  websites, search, onSearchChange,
}: {
  websites?: Website[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
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
          {t("Website")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.websitePresence}
          onChange={mode => onSearchChange(withWebsitePresence(search, mode))}
          hasLabel={t("Has value")}
          missingLabel={t("No value")}
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
                placeholder={t("All websites")}
                searchPlaceholder={t("Search websites…")}
                emptyText={t("No websites found.")}
                aria-label={t("Filter by website")}
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
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select relationship-type filter; rendered wherever relationship types exist. */
export function RelationshipTypeFilterSection({
  relationshipTypes, search, onSearchChange,
}: {
  relationshipTypes?: RelationshipType[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
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
        {t("Relationship type")}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <MultiCombobox
          options={options}
          values={selected}
          onValuesChange={ids => onSearchChange(withRelationshipTypes(search, ids))}
          placeholder={t("All relationship types")}
          searchPlaceholder={t("Search relationship types…")}
          emptyText={t("No relationship types found.")}
          aria-label={t("Filter by relationship type")}
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
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Two multi-selects — languages and usage levels — filtering to bookmarks whose language usages
 * satisfy both on a single association row. Self-fetches its options; hidden when neither vocabulary
 * has any entries.
 */
export function LanguageUsageFilterSection({
  search, onSearchChange,
}: {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: languages = [],
  } = useLanguages();
  const {
    data: levels = [],
  } = useLanguageUsageLevels();

  if (languages.length === 0 && levels.length === 0) return null;

  const selectedLanguages = search.languageUsageLanguages ?? [];
  const selectedLevels = search.languageUsageLevels ?? [];

  return (
    <Collapsible
      defaultOpen
      className="group/language-usage space-y-3"
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
            group-data-[state=open]/language-usage:rotate-180
          "
        />
        {t("Language usage")}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <MultiCombobox
          options={sortLanguagesFavoritesFirst(languages).map(l => ({
            value: l.id,
            label: l.name,
            icon: <Languages className="size-4 shrink-0 text-muted-foreground" />,
          }))}
          values={selectedLanguages}
          onValuesChange={ids => onSearchChange(withLanguageUsageLanguages(search, ids))}
          placeholder={t("Any language")}
          searchPlaceholder={t("Search languages…")}
          emptyText={t("No languages found.")}
          aria-label={t("Filter by language")}
        />
        <MultiCombobox
          options={levels.map(l => ({
            value: l.id,
            label: l.name,
            icon: <Captions className="size-4 shrink-0 text-muted-foreground" />,
          }))}
          values={selectedLevels}
          onValuesChange={ids => onSearchChange(withLanguageUsageLevels(search, ids))}
          placeholder={t("Any usage level")}
          searchPlaceholder={t("Search usage levels…")}
          emptyText={t("No usage levels found.")}
          aria-label={t("Filter by usage level")}
        />
        {(selectedLanguages.length > 0 || selectedLevels.length > 0)
          ? (
            <button
              type="button"
              className="
                text-xs text-primary
                hover:underline
              "
              onClick={() =>
                onSearchChange(withLanguageUsageLevels(withLanguageUsageLanguages(search, []), []))}
            >
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Multi-select person filter; rendered wherever people exist. */
export function PersonFilterSection({
  people, search, onSearchChange,
}: {
  people?: Person[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const options = (people ?? []).map(person => ({
    value: person.id,
    label: person.name,
    names: person.names,
  }));
  const selected = search.people ?? [];

  return (
    <Collapsible
      defaultOpen
      className="group/person space-y-3"
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
            group-data-[state=open]/person:rotate-180
          "
        />
        {t("Person")}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <MultiCombobox
          options={options}
          values={selected}
          onValuesChange={ids => onSearchChange(withPeople(search, ids))}
          placeholder={t("All people")}
          searchPlaceholder={t("Search people…")}
          emptyText={t("No people found.")}
          aria-label={t("Filter by person")}
        />
        {selected.length > 0
          ? (
            <button
              type="button"
              className="
                text-xs text-primary
                hover:underline
              "
              onClick={() => onSearchChange(withPeople(search, []))}
            >
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Custom-property filters plus a warning for properties with no category assignment. */
export function PropertiesFilterSection({
  enabledProperties, propertyGroups, categories, bookmarks, search, onSearchChange, hasCategoryFilter, nameFilter,
}: {
  enabledProperties: CustomProperty[];
  propertyGroups?: PropertyGroup[];
  categories?: Category[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  hasCategoryFilter: boolean;
  nameFilter?: string;
}) {
  const {
    t,
  } = useTranslation();
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
  const presenceFilterChange = (propertyId: string, mode: "has" | "missing" | "exclude" | undefined) =>
    onSearchChange(withPresenceFilter(search, propertyId, mode));
  const choicesFilterChange = (propertyId: string, values: string[]) =>
    onSearchChange(withChoicesFilter(search, propertyId, values));
  const propertyReset = (propertyId: string) =>
    onSearchChange(
      withChoicesFilter(
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
        propertyId,
        [],
      ),
    );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">{t("Properties")}</h2>
      <CustomPropertyFilters
        properties={enabledProperties}
        propertyGroups={propertyGroups}
        categories={categories}
        selectedCategoryIds={selectedCategories}
        nameFilter={nameFilter}
        bookmarks={bookmarks}
        numberValues={search.num ?? {}}
        booleanValues={search.bool ?? {}}
        dateTimeValues={search.date ?? {}}
        presenceValues={search.presence ?? {}}
        choicesValues={search.choices ?? {}}
        onNumberFilterChange={numberFilterChange}
        onBooleanFilterChange={booleanFilterChange}
        onDateTimeFilterChange={dateTimeFilterChange}
        onPresenceFilterChange={presenceFilterChange}
        onChoicesFilterChange={choicesFilterChange}
        onPropertyReset={propertyReset}
      />
      {unassignedProperties.length > 0
        ? (
          <>
            <Separator className="my-3" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium">
                <TriangleAlert className="size-3.5 shrink-0" />
                {unassignedProperties.length === 1
                  ? t("1 property isn't assigned to a category")
                  : t("{{count}} properties aren't assigned to a category", {
                    count: unassignedProperties.length,
                  })}
              </p>
              <p>{unassignedProperties.map(property => property.name).join(", ")}</p>
            </div>
          </>
        )
        : null}
    </div>
  );
}

/** Presence toggle plus section-type checkboxes for bookmarks with sections properties. */
export function SectionsFilterSection({
  search, onSearchChange,
}: {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const selectedTypes: SectionEntryType[] = search.sectionTypes ?? [];
  const filterActive = search.sectionsPresence !== undefined || selectedTypes.length > 0;

  function toggleType(type: SectionEntryType): void {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onSearchChange(withSectionTypes(search, next));
  }

  return (
    <Collapsible
      defaultOpen
      className="group/sections space-y-3"
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
              group-data-[state=open]/sections:rotate-180
            "
          />
          {t("Sections")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.sectionsPresence}
          onChange={mode => onSearchChange(withSectionsPresence(search, mode))}
          hasLabel={t("Has sections")}
          missingLabel={t("No sections")}
        />
      </div>
      <CollapsibleContent className="space-y-2">
        {search.sectionsPresence !== "missing"
          ? (
            <div className="space-y-1.5">
              {SECTION_ENTRY_TYPES.map(type => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="rounded-sm"
                  />
                  {t(SECTION_ENTRY_TYPE_LABELS[type])}
                </label>
              ))}
            </div>
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
              onClick={() => onSearchChange(withSectionTypes(withSectionsPresence(search, undefined), []))}
            >
              {t("Reset")}
            </button>
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
