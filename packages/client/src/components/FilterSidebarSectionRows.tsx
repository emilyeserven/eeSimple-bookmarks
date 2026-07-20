import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, Category, CustomProperty, GenreMood, MediaType, PlaceType, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import { FacetPresenceToggle } from "./FilterFacetControls";
import {
  CategoryFilterBody,
  FillableFieldsFilterBody,
  GenreMoodFilterBody,
  LanguageUsageFilterBody,
  MediaTypeFilterBody,
  PersonFilterBody,
  PlaceTypeFilterBody,
  RelationshipTypeFilterBody,
  SectionsFilterBody,
  TagsFilterBody,
  WebsiteFilterBody,
  YouTubeChannelFilterBody,
} from "./FilterSidebarSectionBodies";
import { useLanguages } from "../hooks/useLanguages";
import { useLanguageUsageLevels } from "../hooks/useLanguageUsageLevels";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  withBooleanFilter,
  withCategoryPresence,
  withChoicesFilter,
  withDateTimeFilter,
  withGenreMoodPresence,
  withMediaSourcePresence,
  withMediaTypePresence,
  withNumberFilter,
  withPeoplePresence,
  withPlaceTypePresence,
  withPresenceFilter,
  withSectionsPresence,
  withTagPresence,
  withWebsitePresence,
  withYouTubeChannelPresence,
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
        <TagsFilterBody
          tree={tree}
          search={search}
          onSearchChange={onSearchChange}
        />
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

  return (
    <Collapsible
      defaultOpen
      className="group/category space-y-3"
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
              group-data-[state=open]/category:rotate-180
            "
          />
          {t("Category")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.categoryPresence}
          onChange={mode => onSearchChange(withCategoryPresence(search, mode))}
          excludeLabel={t("Excludes selected categories")}
          onlyExclude
        />
      </div>
      <CollapsibleContent className="space-y-3">
        <CategoryFilterBody
          categories={categories}
          search={search}
          onSearchChange={onSearchChange}
        />
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

  return (
    <Collapsible
      defaultOpen
      className="group/media-type space-y-3"
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
              group-data-[state=open]/media-type:rotate-180
            "
          />
          {t("Media type")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.mediaTypePresence}
          onChange={mode => onSearchChange(withMediaTypePresence(search, mode))}
          excludeLabel={t("Excludes selected media types")}
          onlyExclude
        />
      </div>
      <CollapsibleContent className="space-y-3">
        <MediaTypeFilterBody
          mediaTypes={mediaTypes}
          search={search}
          onSearchChange={onSearchChange}
        />
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
        <YouTubeChannelFilterBody
          youtubeChannels={youtubeChannels}
          search={search}
          onSearchChange={onSearchChange}
        />
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
        <PlaceTypeFilterBody
          placeTypes={placeTypes}
          search={search}
          onSearchChange={onSearchChange}
        />
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
        <GenreMoodFilterBody
          genreMoods={genreMoods}
          search={search}
          onSearchChange={onSearchChange}
        />
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
        <WebsiteFilterBody
          websites={websites}
          search={search}
          onSearchChange={onSearchChange}
        />
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
        <RelationshipTypeFilterBody
          relationshipTypes={relationshipTypes}
          search={search}
          onSearchChange={onSearchChange}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Two multi-selects — languages and usage levels — filtering to bookmarks whose language usages
 * satisfy both on a single association row. Self-fetches its options (like the body) purely to
 * decide whether to render the accordion at all; hidden when neither vocabulary has any entries.
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
        <LanguageUsageFilterBody
          search={search}
          onSearchChange={onSearchChange}
        />
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

  return (
    <Collapsible
      defaultOpen
      className="group/person space-y-3"
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
              group-data-[state=open]/person:rotate-180
            "
          />
          {t("Person")}
        </CollapsibleTrigger>
        <FacetPresenceToggle
          value={search.peoplePresence}
          onChange={mode => onSearchChange(withPeoplePresence(search, mode))}
          hasLabel={t("Has any")}
          missingLabel={t("Has none")}
        />
      </div>
      <CollapsibleContent className="space-y-3">
        <PersonFilterBody
          people={people}
          search={search}
          onSearchChange={onSearchChange}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Custom-property filters. */
export function PropertiesFilterSection({
  enabledProperties, categories, bookmarks, search, onSearchChange, nameFilter,
}: {
  enabledProperties: CustomProperty[];
  categories?: Category[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  nameFilter?: string;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">{t("Properties")}</h2>
      <CustomPropertyFilters
        properties={enabledProperties}
        categories={categories}
        selectedCategoryIds={search.categories ?? []}
        nameFilter={nameFilter}
        bookmarks={bookmarks}
        numberValues={search.num ?? {}}
        booleanValues={search.bool ?? {}}
        dateTimeValues={search.date ?? {}}
        presenceValues={search.presence ?? {}}
        choicesValues={search.choices ?? {}}
        onNumberFilterChange={(propertyId, range) =>
          onSearchChange(withNumberFilter(search, propertyId, range))}
        onBooleanFilterChange={(propertyId, value) =>
          onSearchChange(withBooleanFilter(search, propertyId, value))}
        onDateTimeFilterChange={(propertyId, range) =>
          onSearchChange(withDateTimeFilter(search, propertyId, range))}
        onPresenceFilterChange={(propertyId, mode) =>
          onSearchChange(withPresenceFilter(search, propertyId, mode))}
        onChoicesFilterChange={(propertyId, values) =>
          onSearchChange(withChoicesFilter(search, propertyId, values))}
        onPropertyReset={propertyId =>
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
          )}
      />
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
        <SectionsFilterBody
          search={search}
          onSearchChange={onSearchChange}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Presence-only toggle for bookmarks carrying a Plex/Kavita/ISBN/podcast-feed identity (see #1072).
 * No combobox — the identity values aren't a pickable taxonomy, so this is just the header row.
 */
export function MediaSourceFilterSection({
  search, onSearchChange,
}: {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold">{t("Media source")}</span>
      <FacetPresenceToggle
        value={search.mediaSourcePresence}
        onChange={mode => onSearchChange(withMediaSourcePresence(search, mode === "exclude" ? undefined : mode))}
        hasLabel={t("Linked to a media source")}
        missingLabel={t("Not linked")}
        hideExclude
      />
    </div>
  );
}

/**
 * Fillable-fields filter: a label over the shared {@link FillableFieldsFilterBody} dropdown, which
 * distinguishes "Has fillable fields" / "Has unfilled fillable fields" / "Nothing to fill" ("Any"
 * clears it).
 */
export function FillableFieldsFilterSection({
  search, onSearchChange,
}: {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold">{t("Fillable fields")}</span>
      <FillableFieldsFilterBody
        search={search}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
