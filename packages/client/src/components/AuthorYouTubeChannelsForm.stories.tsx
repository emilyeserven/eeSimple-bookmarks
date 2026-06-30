import type { Author } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorYouTubeChannelsForm, AuthorYouTubeChannelsView } from "./AuthorYouTubeChannelsForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const author: Author = {
  id: "author-1",
  name: "Derek Muller",
  slug: "derek-muller",
  createdAt: NOW,
  bookmarkCount: 9,
  authorWebsiteUrl: null,
  biographyUrl: null,
  imageUrl: null,
  socialLinks: [],
  youtubeChannelIds: ["channel-veritasium"],
  websiteIds: [],
  publisherIds: [],
};

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
