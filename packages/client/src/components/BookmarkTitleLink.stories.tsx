import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkSecondaryNameField, BookmarkTitleLink, DescriptionOverflowDiv } from "./BookmarkTitleLink";
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
 * The title link renders only the **primary** name (via `resolveDisplayNames` against
 * `bookmark.names`); the secondary form is the separately placeable `secondaryName` card field
 * ({@link BookmarkSecondaryNameField}).
 */
export const Romanized: Story = {
  args: {
    bookmark: makeBookmark({
      title: "東京タワー",
    }),
  },
};

/**
 * The placeable `secondaryName` card field: the de-emphasized **secondary** name. Rendered as its
 * own card field so it can be shown/hidden/repositioned independently of the title.
 */
export const RomanizedField: StoryObj<typeof BookmarkSecondaryNameField> = {
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  render: () => (
    <BookmarkSecondaryNameField
      bookmark={makeBookmark({
        title: "東京タワー",
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
