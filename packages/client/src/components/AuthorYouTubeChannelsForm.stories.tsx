import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorYouTubeChannelsForm, AuthorYouTubeChannelsView } from "./AuthorYouTubeChannelsForm";
import { makeAuthor } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const author = makeAuthor({
  id: "author-1",
  name: "Derek Muller",
  slug: "derek-muller",
  bookmarkCount: 9,
  youtubeChannelIds: ["channel-veritasium"],
});

const meta = {
  title: "Components/AuthorYouTubeChannelsForm",
  component: AuthorYouTubeChannelsForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    author,
  },
} satisfies Meta<typeof AuthorYouTubeChannelsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one channel already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    author: {
      ...author,
      youtubeChannelIds: [],
    },
  },
};

/** Read-only view of the connected channels. */
export const ReadOnlyView: Story = {
  render: () => <AuthorYouTubeChannelsView author={author} />,
};
