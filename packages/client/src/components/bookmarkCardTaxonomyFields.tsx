import type { ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { Bookmark, Category } from "@eesimple/types";
import type { ReactNode } from "react";

import { BookmarkLocationBadges, BookmarkLocationLinks } from "./BookmarkLocationsBox";
import { BookmarkTagLinks, BookmarkTagsBox } from "./BookmarkTagsBox";
import { CategoryPill } from "./CategoryPill";
import { MediaTypePill } from "./MediaTypePill";
import { SourcePill } from "./SourcePill";

import { Badge } from "@/components/ui/badge";

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

/**
 * The render forms for a taxonomy/relation field key (category, website, media type, YouTube channel,
 * tags, locations), or `null` when the field has nothing to show or `key` isn't a taxonomy field.
 */
export function describeTaxonomyField(key: string, args: TaxonomyFieldArgs): FieldRender | null {
  const {
    bookmark, bookmarkCategory, effectiveHideWebsiteForYouTube, placements,
  } = args;
  const {
    website, mediaType, youtubeChannel,
  } = bookmark;
  switch (key) {
    case "category": {
      if (!bookmarkCategory) return null;
      const pill = <CategoryPill category={bookmarkCategory} />;
      return {
        inline: pill,
        block: pill,
        tableName: "Category",
        tableValue: <span className="text-sm">{bookmarkCategory.name}</span>,
      };
    }
    case "website": {
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
        tableName: "Website",
        tableValue: <span className="text-sm">{website.siteName}</span>,
      };
    }
    case "mediaType": {
      if (!mediaType) return null;
      const pill = <MediaTypePill mediaType={mediaType} />;
      return {
        inline: pill,
        block: pill,
        tableName: "Media Type",
        tableValue: <span className="text-sm">{mediaType.name}</span>,
      };
    }
    case "youtubeChannel": {
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
        tableName: "YouTube Channel",
        tableValue: <span className="text-sm">{youtubeChannel.name}</span>,
      };
    }
    case "tags": {
      if (bookmark.tags.length === 0) return null;
      const box = <BookmarkTagsBox tags={bookmark.tags} />;
      // The tags box is block-level — full-width in the Labels zone too. In the Table zone the names
      // render as plain text, or as clickable links when the placement opts in via `clickableTags`.
      const clickableTags = placements.get("tags")?.clickableTags ?? false;
      return {
        inline: null,
        block: box,
        tableName: "Tags",
        tableValue: clickableTags
          ? <BookmarkTagLinks tags={bookmark.tags} />
          : <span className="text-sm">{bookmark.tags.map(tag => tag.name).join(", ")}</span>,
      };
    }
    case "genreMoods": {
      if (bookmark.genreMoods.length === 0) return null;
      const badges = (
        <div className="flex flex-wrap gap-1">
          {bookmark.genreMoods.map(entry => (
            <Badge
              key={entry.id}
              variant="secondary"
            >
              {entry.name}
            </Badge>
          ))}
        </div>
      );
      return {
        inline: badges,
        block: badges,
        tableName: "Genres & Moods",
        tableValue: <span className="text-sm">{bookmark.genreMoods.map(entry => entry.name).join(", ")}</span>,
      };
    }
    case "locations": {
      if (bookmark.locations.length === 0) return null;
      const badges = <BookmarkLocationBadges locations={bookmark.locations} />;
      // Inline, unboxed badges — they flow alongside the card's other pills in the Labels zone
      // instead of sitting in their own bordered box (unlike Tags, which stays a block-level box).
      // The Table zone renders the names as clickable links.
      return {
        inline: badges,
        block: badges,
        tableName: "Locations",
        tableValue: <BookmarkLocationLinks locations={bookmark.locations} />,
      };
    }
    default:
      return null;
  }
}
