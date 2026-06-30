import type { Author } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AuthorsListing } from "./AuthorManager";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const sampleAuthors: Author[] = [
  {
    id: "author-1",
    name: "Jane Author",
    romanizedName: null,
    slug: "jane-author",
    createdAt: NOW,
    bookmarkCount: 12,
    authorWebsiteUrl: null,
    biographyUrl: null,
    imageUrl: null,
    socialLinks: [],
    youtubeChannelIds: [],
    websiteIds: [],
    publisherIds: [],
  },
  {
    id: "author-2",
    name: "John Writer",
    romanizedName: null,
    slug: "john-writer",
    createdAt: NOW,
    bookmarkCount: 0,
    authorWebsiteUrl: null,
    biographyUrl: null,
    imageUrl: null,
    socialLinks: [],
    youtubeChannelIds: [],
    websiteIds: [],
    publisherIds: [],
  },
];

const meta = {
  title: "Components/AuthorsListing",
  component: AuthorsListing,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/authors", () => HttpResponse.json(sampleAuthors)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof AuthorsListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The author listing populated with a couple of authors. */
export const Default: Story = {};

/** No authors yet — the empty-state message is shown. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/authors", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
