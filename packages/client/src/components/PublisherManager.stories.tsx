import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PublishersListing } from "./PublisherManager";
import { makePublisher } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const samplePublishers = [
  makePublisher({
    id: "pub-oreilly",
    name: "O'Reilly Media",
    slug: "oreilly-media",
    websiteId: "site-oreilly",
    website: {
      id: "site-oreilly",
      domain: "oreilly.com",
      siteName: "O'Reilly",
    },
    bookmarkCount: 12,
  }),
  makePublisher({
    id: "pub-manning",
    name: "Manning Publications",
    slug: "manning",
    bookmarkCount: 4,
  }),
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
