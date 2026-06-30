import type { Author, Publisher } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AuthorPublishersForm, AuthorPublishersView } from "./AuthorPublishersForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const samplePublishers: Publisher[] = [
  {
    id: "pub-oreilly",
    name: "O'Reilly Media",
    slug: "oreilly-media",
    websiteId: "site-oreilly",
    website: {
      id: "site-oreilly",
      domain: "oreilly.com",
      siteName: "O'Reilly",
    },
    createdAt: NOW,
    bookmarkCount: 12,
    socialLinks: [],
  },
  {
    id: "pub-manning",
    name: "Manning Publications",
    slug: "manning",
    websiteId: null,
    website: null,
    createdAt: NOW,
    bookmarkCount: 4,
    socialLinks: [],
  },
];

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
  websiteIds: [],
  publisherIds: ["pub-oreilly"],
};

const publishersHandlers = [
  ...apiHandlers,
  http.get("/api/publishers", () => HttpResponse.json(samplePublishers)),
];

const meta = {
  title: "Components/AuthorPublishersForm",
  component: AuthorPublishersForm,
  parameters: {
    msw: {
      handlers: publishersHandlers,
    },
  },
  args: {
    author,
  },
} satisfies Meta<typeof AuthorPublishersForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one publisher already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    author: {
      ...author,
      publisherIds: [],
    },
  },
};

/** Read-only view of the connected publishers. */
export const ReadOnlyView: Story = {
  render: () => <AuthorPublishersView author={author} />,
};
