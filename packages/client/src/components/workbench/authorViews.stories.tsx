import type { Author } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorGeneralView } from "./authorViews";
import { apiHandlers } from "../../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const author: Author = {
  id: "author-1",
  name: "Jane Doe",
  romanizedName: null,
  slug: "jane-doe",
  createdAt: NOW,
  bookmarkCount: 12,
  authorWebsiteUrl: "https://janedoe.example.com",
  biographyUrl: "https://en.wikipedia.org/wiki/Jane_Doe",
  imageUrl: null,
  socialLinks: [
    {
      platform: "x",
      url: "https://x.com/janedoe",
    },
  ],
  youtubeChannelIds: [],
  websiteIds: [],
  publisherIds: [],
};

const meta = {
  title: "Components/Workbench/AuthorGeneralView",
  component: AuthorGeneralView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof AuthorGeneralView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entity: author,
  },
};

export const Minimal: Story = {
  args: {
    entity: {
      ...author,
      id: "author-2",
      name: "Anonymous",
      slug: "anonymous",
      bookmarkCount: 0,
      authorWebsiteUrl: null,
      biographyUrl: null,
      socialLinks: [],
    },
  },
};
