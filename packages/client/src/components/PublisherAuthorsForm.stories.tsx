import type { Author, Publisher } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PublisherAuthorsForm, PublisherAuthorsView } from "./PublisherAuthorsForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const publisher: Publisher = {
  id: "pub-oreilly",
  name: "O'Reilly Media",
  slug: "oreilly-media",
  websiteId: null,
  website: null,
  createdAt: NOW,
  bookmarkCount: 12,
  socialLinks: [],
};

const authors: Author[] = [
  {
    id: "author-kyle",
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
  },
  {
    id: "author-marijn",
    name: "Marijn Haverbeke",
    slug: "marijn-haverbeke",
    createdAt: NOW,
    bookmarkCount: 5,
    authorWebsiteUrl: null,
    biographyUrl: null,
    imageUrl: null,
    socialLinks: [],
    youtubeChannelIds: [],
    websiteIds: [],
    publisherIds: [],
  },
];

const authorHandlers = [
  ...apiHandlers,
  http.get("/api/authors", () => HttpResponse.json(authors)),
];

const meta = {
  title: "Components/PublisherAuthorsForm",
  component: PublisherAuthorsForm,
  parameters: {
    msw: {
      handlers: authorHandlers,
    },
  },
  args: {
    publisher,
  },
} satisfies Meta<typeof PublisherAuthorsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one author connected. */
export const Default: Story = {};

/** Read-only view of the connected authors. */
export const ReadOnlyView: Story = {
  render: () => <PublisherAuthorsView publisher={publisher} />,
};
