import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCardIsbnLinks } from "./BookmarkCardIsbnLinks";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";

const isbnProperty = makeCustomProperty({
  id: "prop-isbn",
  name: "ISBN",
  slug: "isbn",
  type: "text",
});

const bookmarkWithIsbn = makeBookmark({
  id: "bookmark-book",
  title: "A Programming Book",
  textValues: [
    {
      propertyId: "prop-isbn",
      value: "9780131103627",
    },
  ],
});

const bookmarkWithoutIsbn = makeBookmark({
  id: "bookmark-no-isbn",
  title: "A page with no ISBN",
});

const meta = {
  title: "Components/BookmarkCardIsbnLinks",
  component: BookmarkCardIsbnLinks,
  args: {
    bookmark: bookmarkWithIsbn,
    properties: [isbnProperty],
  },
} satisfies Meta<typeof BookmarkCardIsbnLinks>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Renders nothing when the bookmark has no qualifying text values. */
export const NoIsbn: Story = {
  args: {
    bookmark: bookmarkWithoutIsbn,
  },
};
