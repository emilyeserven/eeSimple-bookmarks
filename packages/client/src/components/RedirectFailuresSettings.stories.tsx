import type { RedirectFailureWebsite } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { RedirectFailuresSettings } from "./RedirectFailuresSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const sites: RedirectFailureWebsite[] = [
  {
    id: "site-medium",
    domain: "medium.com",
    siteName: "Medium",
    slug: "medium",
    imageUrl: null,
    bookmarks: [
      {
        id: "bm-1",
        url: "https://medium.com/p/abc123",
        title: "Understanding React Server Components",
        description: "A deep dive into RSC.",
        imageUrl: null,
      },
      {
        id: "bm-2",
        url: "https://medium.com/p/def456",
        title: "TypeScript tips you missed",
        description: null,
        imageUrl: null,
      },
    ],
  },
];

const meta = {
  title: "Settings/RedirectFailuresSettings",
  component: RedirectFailuresSettings,
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/websites/redirect-failures", () => HttpResponse.json(sites)),
      ],
    },
  },
} satisfies Meta<typeof RedirectFailuresSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A flagged website with bookmarks whose URLs need fixing. */
export const Default: Story = {};

/** No websites flagged — shows the empty-state message. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/websites/redirect-failures", () => HttpResponse.json([])),
      ],
    },
  },
};
