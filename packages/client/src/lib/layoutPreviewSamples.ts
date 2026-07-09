import type { Bookmark, LayoutableEntityKind } from "@eesimple/types";

import { sampleBookmark } from "../test-utils/story-mocks";

import {
  makeBookmarkImage,
  makeCategory,
  makeCustomProperty,
  makeGenreMood,
  makeGroup,
  makeLocation,
  makeMediaType,
  makeNewsletter,
  makePerson,
  makeTag,
  makeWebsite,
  makeYouTubeChannel,
} from "@/test-utils/factories";

/**
 * Sentinel id for the synthetic "everything filled in" preview entity — distinguishes the Sample
 * option from a real picked instance (whose id is a real uuid). Never collides with a stored row.
 */
export const SAMPLE_ID = "__layout_preview_sample__";

/**
 * Build a **fully-populated** sample entity for the Page Layouts preview (#1225): every optional field
 * the factories default empty is filled here so *every* placeable field renders in the preview, even
 * when the real data set is sparse. Reuses the shared `make*` factories (the CLAUDE.md single source of
 * truth for type-complete construction) plus the rich `sampleBookmark` from `story-mocks`.
 *
 * Returns `null` for the two config entities (`autofill`, `card-display-rule`) whose full shape is
 * impractical to synthesize (large condition/display trees) — the preview falls back to a real instance
 * for those (a seeded Default card rule always exists).
 */
export function buildSampleEntity(kind: LayoutableEntityKind): { id: string } | null {
  switch (kind) {
    case "bookmark": {
      const bookmark: Bookmark = {
        ...sampleBookmark,
        id: SAMPLE_ID,
        description: "A richly populated sample bookmark shown so every card/detail field has content.",
        image: makeBookmarkImage(),
        images: [makeBookmarkImage()],
        year: 2026,
        isbn: "9780000000001",
        priority: 10,
      };
      return bookmark;
    }
    case "category":
      return makeCategory({
        id: SAMPLE_ID,
        name: "Reading",
        slug: "reading",
        description: "Long-form articles and books to work through.",
        icon: "BookOpen",
      });
    case "newsletter":
      return makeNewsletter({
        id: SAMPLE_ID,
        name: "The Weekly Dispatch",
        slug: "the-weekly-dispatch",
        description: "A weekly roundup of links worth keeping.",
        bookmarkCount: 12,
        tagIds: ["tag-cli"],
      });
    case "group":
      return makeGroup({
        id: SAMPLE_ID,
        name: "Penguin Random House",
        slug: "penguin-random-house",
        description: "A large trade book publisher.",
        bookmarkCount: 8,
        year: 1927,
        imageUrl: "https://example.com/group.webp",
      });
    case "custom-property":
      return makeCustomProperty({
        id: SAMPLE_ID,
        name: "Priority",
        slug: "priority",
        type: "number",
        description: "How urgent this bookmark is, from 0 to 10.",
        numberMin: 0,
        numberMax: 10,
        unitSingular: "point",
        unitPlural: "points",
      });
    case "genre-mood":
      return makeGenreMood({
        id: SAMPLE_ID,
        name: "Ambient",
        slug: "ambient",
        description: "Calm, atmospheric, background-friendly.",
        bookmarkCount: 5,
      });
    case "tag":
      return makeTag({
        id: SAMPLE_ID,
        name: "reference",
        slug: "reference",
        description: "Material worth returning to.",
        bookmarkCount: 14,
        ownBookmarkCount: 9,
      });
    case "website":
      return makeWebsite({
        id: SAMPLE_ID,
        domain: "example.com",
        siteName: "Example",
        slug: "example",
        description: "A representative source site.",
        bookmarkCount: 6,
        imageUrl: "https://example.com/favicon.webp",
      });
    case "media-type":
      return makeMediaType({
        id: SAMPLE_ID,
        name: "Article",
        slug: "article",
        description: "Written, long-form web content.",
        icon: "FileText",
        bookmarkCount: 20,
      });
    case "location":
      return makeLocation({
        id: SAMPLE_ID,
        name: "Kyoto",
        slug: "kyoto",
        description: "A city in Japan's Kansai region.",
        latitude: 35.0116,
        longitude: 135.7681,
        countryCode: "JP",
      });
    case "youtube-channel":
      return makeYouTubeChannel({
        id: SAMPLE_ID,
        channelKey: "@example",
        name: "Example Channel",
        slug: "example-channel",
        description: "A representative YouTube channel.",
        bookmarkCount: 7,
        imageUrl: "https://example.com/avatar.webp",
      });
    case "person":
      return makePerson({
        id: SAMPLE_ID,
        name: "Ada Lovelace",
        slug: "ada-lovelace",
        description: "A representative creator.",
        bookmarkCount: 4,
        year: 1815,
        imageUrl: "https://example.com/person.webp",
      });
    case "autofill":
    case "card-display-rule":
      return null;
    default:
      return null;
  }
}
