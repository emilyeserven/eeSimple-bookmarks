import type { Author } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorWebsitesForm, AuthorWebsitesView } from "./AuthorWebsitesForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const author: Author = {
  id: "author-1",
  name: "Kyle Simpson",
  slug: "kyle-simpson",
  createdAt: NOW,
  bookmarkCount: 9,
  authorWebsiteUrl: null,
  biographyUrl: null,
  imageUrl: null,
  socialLinks: [],
  youtubeChannelIds: [],
  websiteIds: ["site-github"],
  publisherIds: [],
};

const meta = {
  title: "Components/AuthorWebsitesForm",
  component: AuthorWebsitesForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    author,
  },
} satisfies Meta<typeof AuthorWebsitesForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one website already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    author: {
      ...author,
      websiteIds: [],
    },
  },
};

/** Read-only view of the connected websites. */
export const ReadOnlyView: Story = {
  render: () => <AuthorWebsitesView author={author} />,
};
