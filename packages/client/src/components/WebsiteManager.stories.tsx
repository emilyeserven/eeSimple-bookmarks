import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { WebsitesListing } from "./WebsiteManager";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

function makeWebsite(overrides: Partial<Website> & Pick<Website, "id" | "domain" | "siteName" | "slug">): Website {
  return {
    builtIn: false,
    shortenedLinks: [],
    paramRules: [],
    createdAt: NOW,
    bookmarkCount: 0,
    imageUrl: null,
    category: null,
    socialLinks: [],
    alternateNames: [],
    ...overrides,
  };
}

const sampleWebsites: Website[] = [
  makeWebsite({
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
    bookmarkCount: 42,
  }),
  makeWebsite({
    id: "site-mdn",
    domain: "developer.mozilla.org",
    siteName: "MDN Web Docs",
    slug: "mdn",
    bookmarkCount: 7,
  }),
];

const meta = {
  title: "Components/WebsitesListing",
  component: WebsitesListing,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/websites", () => HttpResponse.json(sampleWebsites)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof WebsitesListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The website listing populated with a couple of sites. */
export const Default: Story = {};

/** No websites yet — the empty-state message is shown. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/websites", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
