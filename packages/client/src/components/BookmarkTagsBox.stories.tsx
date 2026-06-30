import type { BookmarkTag } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkTagLinks, BookmarkTagsBox } from "./BookmarkTagsBox";
import { apiHandlers } from "../test-utils/story-mocks";

const tags: BookmarkTag[] = [
  {
    id: "tag-dev",
    name: "dev",
    slug: "dev",
    parentId: null,
    editableOnCard: false,
  },
  {
    id: "tag-tools",
    name: "tools",
    slug: "tools",
    parentId: "tag-dev",
    editableOnCard: false,
  },
  {
    id: "tag-cli",
    name: "cli",
    slug: "cli",
    parentId: "tag-tools",
    editableOnCard: false,
  },
];

const manyTags: BookmarkTag[] = Array.from({
  length: 24,
}, (_, index) => ({
  id: `tag-${index}`,
  name: `topic-${index}`,
  slug: `topic-${index}`,
  parentId: null,
  editableOnCard: false,
}));

const meta = {
  title: "Bookmarks/BookmarkTagsBox",
  component: BookmarkTagsBox,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tags,
  },
} satisfies Meta<typeof BookmarkTagsBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Enough tags to overflow the box, revealing the top/bottom fade gradients. */
export const Overflowing: Story = {
  args: {
    tags: manyTags,
  },
};

/** The inline comma-separated form used in the card-table zone. */
export const InlineLinks: StoryObj<typeof BookmarkTagLinks> = {
  render: () => <BookmarkTagLinks tags={tags} />,
};
