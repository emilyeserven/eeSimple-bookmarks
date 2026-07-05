import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BookmarkCategoryColumnCell,
  BookmarkMediaTypeColumnCell,
  BookmarkPropertyColumnCell,
  BookmarkSourceColumnCell,
  BookmarkTagsColumnCell,
} from "./bookmarkPillCells";
import { makeBookmark, makeCustomProperty } from "../../test-utils/factories";
import { sampleCategories } from "../../test-utils/story-mocks";

const bookmark = makeBookmark({
  id: "bm-pills",
  title: "A bookmark",
  categoryId: "cat-workflow",
  website: {
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
    imageUrl: "https://github.githubassets.com/favicons/favicon.png",
  },
  youtubeChannel: {
    id: "chan-1",
    name: "Fireship",
    slug: "fireship",
    imageUrl: null,
  },
  mediaType: {
    id: "media-article",
    name: "Article",
    slug: "article",
    icon: "FileText",
    parentId: null,
    builtIn: false,
  },
  tags: [
    {
      id: "tag-cli",
      name: "cli",
      slug: "cli",
      parentId: null,
      editableOnCard: false,
    },
    {
      id: "tag-react",
      name: "react",
      slug: "react",
      parentId: null,
      editableOnCard: false,
    },
  ],
  numberValues: [
    {
      propertyId: "prop-rating",
      value: 4,
    },
  ],
});

const ratingProperty = makeCustomProperty({
  id: "prop-rating",
  name: "Rating",
  slug: "rating",
  type: "ratingScale",
  ratingMax: 5,
});

const meta = {
  title: "Components/Tables/BookmarkPillCells",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Category: Story = {
  render: () => (
    <BookmarkCategoryColumnCell
      bookmark={bookmark}
      allCategories={sampleCategories}
    />
  ),
};

export const Source: Story = {
  render: () => (
    <BookmarkSourceColumnCell
      bookmark={bookmark}
      hideWebsiteForYouTube={false}
      websiteHidden={false}
      youtubeChannelHidden={false}
    />
  ),
};

export const MediaType: Story = {
  render: () => <BookmarkMediaTypeColumnCell bookmark={bookmark} />,
};

export const Tags: Story = {
  render: () => <BookmarkTagsColumnCell bookmark={bookmark} />,
};

export const RatingProperty: Story = {
  render: () => (
    <BookmarkPropertyColumnCell
      bookmark={bookmark}
      property={ratingProperty}
      showIfFalse={false}
    />
  ),
};
