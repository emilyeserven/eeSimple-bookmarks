import type { Author, Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { WebsiteAuthorsForm, WebsiteAuthorsView } from "./WebsiteAuthorsForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const website: Website = {
  id: "site-github",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  builtIn: false,
  shortenedLinks: [],
  paramRules: [],
  createdAt: NOW,
  bookmarkCount: 42,
  imageUrl: null,
  socialLinks: [],
  alternateNames: [],
};

const sampleAuthors: Author[] = [
  {
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
  },
  {
    id: "author-2",
    name: "Sarah Drasner",
    slug: "sarah-drasner",
    createdAt: NOW,
    bookmarkCount: 4,
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
  title: "Components/WebsiteAuthorsForm",
  component: WebsiteAuthorsForm,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/authors", () => HttpResponse.json(sampleAuthors)),
        ...apiHandlers,
      ],
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof WebsiteAuthorsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one author already connected. */
export const Default: Story = {};

/** No authors exist yet — the empty-state message is shown. */
export const NoAuthors: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/authors", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};

/** Read-only view of the connected authors. */
export const ReadOnlyView: Story = {
  render: () => <WebsiteAuthorsView website={website} />,
};
