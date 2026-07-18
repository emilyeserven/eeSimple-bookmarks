import type { ComboboxOption } from "./Combobox";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Category, GenreMood, MediaType, PlaceType, RelationshipType, SectionEntryType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { SECTION_ENTRY_TYPE_LABELS, SECTION_ENTRY_TYPES } from "@eesimple/types";
import { Captions, Drama, Globe, Languages, MapPin, MonitorPlay, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { FacetChips } from "./FilterFacetControls";
import { MultiCombobox } from "./MultiCombobox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { useLanguages } from "../hooks/useLanguages";
import { useLanguageUsageLevels } from "../hooks/useLanguageUsageLevels";
import {
  withPeople,
  withCategories,
  withCategoryPresence,
  withGenreMoodPresence,
  withGenreMoods,
  withMediaTypePresence,
  withMediaTypes,
  withPeoplePresence,
  withLanguageUsageLanguages,
  withLanguageUsageLevels,
  withPlaceTypePresence,
  withPlaceTypes,
  withRelationshipTypes,
  withSectionTypes,
  withSectionsPresence,
  withTagPresence,
  withTags,
  withWebsitePresence,
  withWebsites,
  withFillableFieldsPresence,
  withYouTubeChannelPresence,
  withYouTubeChannels,
} from "../lib/bookmarkSearch";
import { useBuiltInName, useLanguageName } from "../lib/builtInName";
import { mediaTypeNodesToOptions } from "../lib/comboboxOptions";
import { sortFavoritesFirst } from "../lib/favoritesOrder";
import { sortLanguagesFavoritesFirst } from "../lib/languageOptions";
import { buildMediaTypeTree } from "../lib/mediaTypeTree";
import { tagNodesToOptions } from "../lib/tagTree";

/** Tiered-tag filter body: a multi-select tree combobox plus Reset, driving `search`. */
export function TagsFilterBody({
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
    <>
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
    </>
  );
}

/** Multi-select category filter body; only rendered on the overall Bookmarks page. */
export function CategoryFilterBody({
  categories, search, onSearchChange,
}: {
  categories?: Category[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const categoryOptions = sortFavoritesFirst(categories ?? []).map(category => ({
    value: category.id,
    label: category.name,
    names: category.names,
  }));
  const selectedCategories = search.categories ?? [];
  const allSelected = categoryOptions.length > 0 && selectedCategories.length === categoryOptions.length;
  const filterActive = selectedCategories.length > 0 || search.categoryPresence !== undefined;

  return (
    <>
      {search.categoryPresence !== "missing"
        ? (
          <MultiCombobox
            options={categoryOptions}
            values={selectedCategories}
            onValuesChange={ids => onSearchChange(withCategories(search, ids))}
            placeholder={t("All categories")}
            aria-label={t("Filter by category")}
          />
        )
        : null}
      {categoryOptions.length > 0 || filterActive
        ? (
          <div className="flex items-center gap-3">
            {search.categoryPresence !== "missing" && !allSelected
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
            {filterActive
              ? (
                <button
                  type="button"
                  className="
                    text-xs text-primary
                    hover:underline
                  "
                  onClick={() => onSearchChange(withCategoryPresence(withCategories(search, []), undefined))}
                >
                  {t("Reset")}
                </button>
              )
              : null}
          </div>
        )
        : null}
    </>
  );
}

/** Multi-select media-type filter body with expandable parent groups. */
export function MediaTypeFilterBody({
  mediaTypes, search, onSearchChange,
}: {
  mediaTypes?: MediaType[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const builtInName = useBuiltInName();
  const options = mediaTypeNodesToOptions(buildMediaTypeTree(mediaTypes ?? []), builtInName);
  const selected = search.mediaTypes ?? [];
  const filterActive = selected.length > 0 || search.mediaTypePresence !== undefined;

  return (
    <>
      <TreeMultiCombobox
        options={options}
        values={selected}
        onValuesChange={ids => onSearchChange(withMediaTypes(search, ids))}
        placeholder={t("All media types")}
        searchPlaceholder={t("Search media types…")}
        emptyText={t("No media types found.")}
        aria-label={t("Filter by media type")}
      />
      {filterActive
        ? (
          <button
            type="button"
            className="
              text-xs text-primary
              hover:underline
            "
            onClick={() => onSearchChange(withMediaTypePresence(withMediaTypes(search, []), undefined))}
          >
            {t("Reset")}
          </button>
        )
        : null}
    </>
  );
}

/** Multi-select YouTube-channel filter body with favicons. */
export function YouTubeChannelFilterBody({
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
    <>
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
    </>
  );
}

/**
 * Multi-select place-type filter body; options are keyed by the place type's normalized `slug`,
 * matching how `BookmarkLocation.placeType` is compared server-side.
 */
export function PlaceTypeFilterBody({
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
    <>
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
    </>
  );
}

/** Multi-select Genres & Moods filter body ("any match"). */
export function GenreMoodFilterBody({
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
    <>
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
    </>
  );
}

/** Multi-select website filter body with favicons. */
export function WebsiteFilterBody({
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
    <>
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
    </>
  );
}

/** Multi-select relationship-type filter body. */
export function RelationshipTypeFilterBody({
  relationshipTypes, search, onSearchChange,
}: {
  relationshipTypes?: RelationshipType[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const builtInName = useBuiltInName();
  const options = (relationshipTypes ?? []).filter(rt => !rt.hidden).map(rt => ({
    value: rt.id,
    label: builtInName(rt),
    searchAlias: rt.builtIn ? rt.name : undefined,
    icon: <Share2 className="size-4 shrink-0 text-muted-foreground" />,
  }));
  const selected = search.relationshipTypes ?? [];

  return (
    <>
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
    </>
  );
}

/**
 * Two multi-selects — languages and usage levels — filtering to bookmarks whose language usages
 * satisfy both on a single association row. Self-fetches its options; renders nothing when neither
 * vocabulary has any entries (the wrapper checks the same condition to decide whether to render its
 * accordion at all).
 */
export function LanguageUsageFilterBody({
  search, onSearchChange,
}: {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const languageName = useLanguageName();
  const builtInName = useBuiltInName();
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
    <>
      <MultiCombobox
        options={sortLanguagesFavoritesFirst(languages).map(l => ({
          value: l.id,
          label: languageName(l),
          searchAlias: l.builtIn ? l.name : undefined,
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
        options={levels.filter(l => !l.hidden).map(l => ({
          value: l.id,
          label: builtInName(l),
          searchAlias: l.builtIn ? l.name : undefined,
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
    </>
  );
}

/** Multi-select person filter body. */
export function PersonFilterBody({
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
  const filterActive = selected.length > 0 || search.peoplePresence !== undefined;

  return (
    <>
      {search.peoplePresence !== "missing"
        ? (
          <>
            <MultiCombobox
              options={options}
              values={selected}
              onValuesChange={ids => onSearchChange(withPeople(search, ids))}
              placeholder={t("All people")}
              searchPlaceholder={t("Search people…")}
              emptyText={t("No people found.")}
              aria-label={t("Filter by person")}
            />
            <FacetChips
              options={options}
              values={selected}
              onValuesChange={ids => onSearchChange(withPeople(search, ids))}
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
            onClick={() => onSearchChange(withPeoplePresence(withPeople(search, []), undefined))}
          >
            {t("Reset")}
          </button>
        )
        : null}
    </>
  );
}

/** Section-type checkbox list body for bookmarks with sections properties. */
export function SectionsFilterBody({
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
    <>
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
    </>
  );
}

/** Sentinel value for the "Any" (no filter) row of the Fillable Fields dropdown. */
const FILLABLE_ANY = "any";

/**
 * Fillable-fields filter body: a single-select dropdown distinguishing "Has fillable fields" (targets
 * a bookmark field, filled or not — `hasAnyFillableField`) from "Has unfilled fillable fields" (an
 * unfilled target, i.e. something to fill — `hasFillableFields`) and "Nothing to fill" (its negation).
 * "Any" clears the filter. Shared by the sidebar section and the pill-row popover.
 */
export function FillableFieldsFilterBody({
  search, onSearchChange,
}: {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();

  const options: ComboboxOption[] = [
    {
      value: FILLABLE_ANY,
      label: t("Any"),
    },
    {
      value: "fillable",
      label: t("Has fillable fields"),
    },
    {
      value: "has",
      label: t("Has unfilled fillable fields"),
    },
    {
      value: "missing",
      label: t("Nothing to fill"),
    },
  ];

  return (
    <Combobox
      options={options}
      value={search.fillableFieldsPresence ?? FILLABLE_ANY}
      aria-label={t("Filter by fillable fields")}
      onValueChange={next =>
        onSearchChange(withFillableFieldsPresence(
          search,
          next === undefined || next === FILLABLE_ANY ? undefined : (next as "has" | "fillable" | "missing"),
        ))}
    />
  );
}
