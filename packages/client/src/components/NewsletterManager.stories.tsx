import type { Newsletter } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { NewslettersListing } from "./NewsletterManager";
import { makeNewsletter } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const sampleNewsletters: Newsletter[] = [
  makeNewsletter({
    id: "newsletter-1",
    name: "Weekly Digest",
    slug: "weekly-digest",
    bookmarkCount: 8,
  }),
  makeNewsletter({
    id: "newsletter-2",
    name: "Engineering Notes",
    slug: "engineering-notes",
  }),
];

const meta = {
  title: "Components/NewslettersListing",
  component: NewslettersListing,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/newsletters", () => HttpResponse.json(sampleNewsletters)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof NewslettersListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The newsletter listing populated with a couple of newsletters. */
export const Default: Story = {};

/** No newsletters yet — the empty-state message is shown. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/newsletters", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
