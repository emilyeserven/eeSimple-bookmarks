import type { ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, Category } from "@eesimple/types";
import type { ReactNode } from "react";

import { BookmarkGroupBadges, BookmarkGroupLinks } from "./BookmarkGroupsBox";
import { BookmarkLocationBadges, BookmarkLocationLinks } from "./BookmarkLocationsBox";
import { BookmarkPeopleBadges, BookmarkPeopleLinks } from "./BookmarkPeopleBox";
import { BookmarkTagLinks, BookmarkTagsBox } from "./BookmarkTagsBox";
import { CategoryPill } from "./CategoryPill";
import { GenreMoodHierarchyHoverCard } from "./GenreMoodHierarchyHoverCard";
import { MediaTypePill } from "./MediaTypePill";
import { SourcePill } from "./SourcePill";

import { Badge } from "@/components/ui/badge";
import i18n from "@/i18n";

/**
 * How one field can render in the card body. `inline` is its compact pill/badge form (the `label`
 * zone); `block` is its full-width form (the `single` zones); `tableName`/`tableValue` are the two
 * columns of the `table` zone. A form left `null` falls back to the other one.
 */
export interface FieldRender {
  inline: ReactNode;
  block: ReactNode;
  tableName: string;
  tableValue: ReactNode;
}

interface TaxonomyFieldArgs {
  bookmark: Bookmark;
  bookmarkCategory: Category | undefined;
  effectiveHideWebsiteForYouTube: boolean;
  placements: Map<string, ResolvedFieldPlacement>;
}

function categoryField({
  bookmarkCategory,
}: TaxonomyFieldArgs): FieldRender | null {
  if (!bookmarkCategory) return null;
  const pill = <CategoryPill category={bookmarkCategory} />;
  return {
    inline: pill,
    block: pill,
    tableName: i18n.t("Category"),
    tableValue: <span className="text-sm">{bookmarkCategory.name}</span>,
  };
}

function websiteField({
  bookmark, effectiveHideWebsiteForYouTube,
}: TaxonomyFieldArgs): FieldRender | null {
  const {
    website, youtubeChannel,
  } = bookmark;
  if (!website || (youtubeChannel && effectiveHideWebsiteForYouTube)) return null;
  const pill = (
    <SourcePill
      type="website"
      data={website}
    />
  );
  return {
    inline: pill,
    block: pill,
    tableName: i18n.t("Website"),
    tableValue: <span className="text-sm">{website.siteName}</span>,
  };
}

function mediaTypeField({
  bookmark, placements,
}: TaxonomyFieldArgs): FieldRender | null {
  const {
    mediaType,
  } = bookmark;
  if (!mediaType) return null;
  const showHierarchyOnHover = placements.get("mediaType")?.showMediaTypeHierarchyOnHover ?? false;
  const pill = (
    <MediaTypePill
      mediaType={mediaType}
      showHierarchyOnHover={showHierarchyOnHover}
    />
  );
  return {
    inline: pill,
    block: pill,
    tableName: i18n.t("Media Type"),
    tableValue: <span className="text-sm">{mediaType.name}</span>,
  };
}

function youtubeChannelField({
  bookmark,
}: TaxonomyFieldArgs): FieldRender | null {
  const {
    youtubeChannel,
  } = bookmark;
  if (!youtubeChannel) return null;
  const pill = (
    <SourcePill
      type="youtube-channel"
      data={youtubeChannel}
    />
  );
  return {
    inline: pill,
    block: pill,
    tableName: i18n.t("YouTube Channel"),
    tableValue: <span className="text-sm">{youtubeChannel.name}</span>,
  };
}

function tagsField({
  bookmark, placements,
}: TaxonomyFieldArgs): FieldRender | null {
  if (bookmark.tags.length === 0) return null;
  const tagsPlacement = placements.get("tags");
  // The tags box is block-level — full-width in the Labels zone too. In the Table zone the names
  // render as plain text, or as clickable links when the placement opts in via `clickableTags`.
  const clickableTags = tagsPlacement?.clickableTags ?? false;
  const showHierarchyOnHover = tagsPlacement?.showTagHierarchyOnHover ?? false;
  const box = (
    <BookmarkTagsBox
      tags={bookmark.tags}
      showHierarchyOnHover={showHierarchyOnHover}
    />
  );
  return {
    inline: null,
    block: box,
    tableName: i18n.t("Tags"),
    tableValue: clickableTags
      ? (
        <BookmarkTagLinks
          tags={bookmark.tags}
          showHierarchyOnHover={showHierarchyOnHover}
        />
      )
      : <span className="text-sm">{bookmark.tags.map(tag => tag.name).join(", ")}</span>,
  };
}

function genreMoodsField({
  bookmark, placements,
}: TaxonomyFieldArgs): FieldRender | null {
  if (bookmark.genreMoods.length === 0) return null;
  const showHierarchyOnHover = placements.get("genreMoods")?.showGenreMoodHierarchyOnHover ?? false;
  const badges = (
    <div className="flex flex-wrap gap-1">
      {bookmark.genreMoods.map((entry) => {
        const badge = (
          <Badge
            variant="secondary"
          >
            {entry.name}
          </Badge>
        );
        return (
          <div key={entry.id}>
            {showHierarchyOnHover
              ? (
                <GenreMoodHierarchyHoverCard genreMood={entry}>
                  {badge}
                </GenreMoodHierarchyHoverCard>
              )
              : badge}
          </div>
        );
      })}
    </div>
  );
  return {
    inline: badges,
    block: badges,
    tableName: i18n.t("Genres & Moods"),
    tableValue: <span className="text-sm">{bookmark.genreMoods.map(entry => entry.name).join(", ")}</span>,
  };
}

function locationsField({
  bookmark, placements,
}: TaxonomyFieldArgs): FieldRender | null {
  if (bookmark.locations.length === 0) return null;
  const showHierarchyOnHover = placements.get("locations")?.showLocationHierarchyOnHover ?? false;
  const badges = (
    <BookmarkLocationBadges
      locations={bookmark.locations}
      showHierarchyOnHover={showHierarchyOnHover}
    />
  );
  // Inline, unboxed badges — they flow alongside the card's other pills in the Labels zone
  // instead of sitting in their own bordered box (unlike Tags, which stays a block-level box).
  // The Table zone renders the names as clickable links.
  return {
    inline: badges,
    block: badges,
    tableName: i18n.t("Locations"),
    tableValue: (
      <BookmarkLocationLinks
        locations={bookmark.locations}
        showHierarchyOnHover={showHierarchyOnHover}
      />
    ),
  };
}

function peopleField({
  bookmark,
}: TaxonomyFieldArgs): FieldRender | null {
  if (bookmark.people.length === 0) return null;
  const badges = <BookmarkPeopleBadges people={bookmark.people} />;
  return {
    inline: badges,
    block: badges,
    tableName: i18n.t("People"),
    tableValue: <BookmarkPeopleLinks people={bookmark.people} />,
  };
}

function groupsField({
  bookmark,
}: TaxonomyFieldArgs): FieldRender | null {
  if (bookmark.groups.length === 0) return null;
  const badges = <BookmarkGroupBadges groups={bookmark.groups} />;
  return {
    inline: badges,
    block: badges,
    tableName: i18n.t("Groups"),
    tableValue: <BookmarkGroupLinks groups={bookmark.groups} />,
  };
}

/** The taxonomy/relation field renderers, keyed by field key. A new taxonomy field = one entry. */
const TAXONOMY_FIELD_RENDERERS: Record<string, (args: TaxonomyFieldArgs) => FieldRender | null> = {
  category: categoryField,
  website: websiteField,
  mediaType: mediaTypeField,
  youtubeChannel: youtubeChannelField,
  tags: tagsField,
  genreMoods: genreMoodsField,
  locations: locationsField,
  people: peopleField,
  groups: groupsField,
};

/**
 * The render forms for a taxonomy/relation field key (category, website, media type, YouTube
 * channel, tags, genres & moods, locations, people, groups), or `null` when the field has
 * nothing to show or `key` isn't a taxonomy field.
 */
export function describeTaxonomyField(key: string, args: TaxonomyFieldArgs): FieldRender | null {
  return TAXONOMY_FIELD_RENDERERS[key]?.(args) ?? null;
}
