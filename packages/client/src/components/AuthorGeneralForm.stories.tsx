import type { Author } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorGeneralForm } from "./AuthorGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const author: Author = {
  id: "author-1",
  name: "Jane Author",
  romanizedName: null,
  slug: "jane-author",
  createdAt: "2026-06-01T00:00:00.000Z",
  bookmarkCount: 3,
  authorWebsiteUrl: "https://janeauthor.example.com",
  biographyUrl: null,
  imageUrl: null,
  socialLinks: [],
  youtubeChannelIds: [],
  websiteIds: [],
  publisherIds: [],
};

const meta = {
  title: "Components/AuthorGeneralForm",
  component: AuthorGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    author,
  },
} satisfies Meta<typeof AuthorGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Author General edit tab — name, URLs, avatar, and social links, all auto-saving. */
export const Default: Story = {};
