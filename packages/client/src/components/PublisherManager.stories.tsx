import type { Publisher } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PublishersListing } from "./PublisherManager";
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

const meta = {
  title: "Settings/PublisherManager",
  component: PublishersListing,
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/publishers", () => HttpResponse.json(samplePublishers)),
      ],
    },
  },
} satisfies Meta<typeof PublishersListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A populated, searchable publisher listing. */
export const Default: Story = {};

/** No publishers yet — shows the empty-state message. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/publishers", () => HttpResponse.json([])),
      ],
    },
  },
};
