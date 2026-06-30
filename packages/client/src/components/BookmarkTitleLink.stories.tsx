import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkTitleLink, DescriptionOverflowDiv } from "./BookmarkTitleLink";
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

/** A title with a romanized secondary line beneath it. */
export const Romanized: Story = {
  args: {
    bookmark: makeBookmark({
      title: "東京タワー",
      romanizedTitle: "Tōkyō Tawā",
    }),
  },
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
