import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkRomanizedField, BookmarkTitleLink, DescriptionOverflowDiv } from "./BookmarkTitleLink";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkTitleLink",
  component: BookmarkTitleLink,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkTitleLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The title link now renders only the **primary** of the title / romanized pair (per the global
 * "Show Romanized by default" toggle); the romanized form is the separately placeable
 * `romanizedName` card field ({@link BookmarkRomanizedField}). With the toggle off (default), the
 * primary is the native title.
 */
export const Romanized: Story = {
  args: {
    bookmark: makeBookmark({
      title: "東京タワー",
      romanizedName: "Tōkyō Tawā",
    }),
  },
};

/**
 * The placeable `romanizedName` card field: the de-emphasized **secondary** of the pair (the
 * romanized form when "Show Romanized by default" is off). Rendered as its own card field so it can
 * be shown/hidden/repositioned independently of the title.
 */
export const RomanizedField: StoryObj<typeof BookmarkRomanizedField> = {
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  render: () => (
    <BookmarkRomanizedField
      bookmark={makeBookmark({
        title: "東京タワー",
        romanizedName: "Tōkyō Tawā",
      })}
    />
  ),
};

/** The clamped, fade-overflow description box used beside the title. */
export const DescriptionOverflow: StoryObj<typeof DescriptionOverflowDiv> = {
  render: () => (
    <div className="w-80">
      <DescriptionOverflowDiv
        description={"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(12)}
      />
    </div>
  ),
};
