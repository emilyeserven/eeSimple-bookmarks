import type { HomepageSection } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { HomepageSectionsSettings } from "./HomepageSectionsSettings";
import { makeHomepageSection } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const sections: HomepageSection[] = [
  makeHomepageSection({
    id: "section-reading",
    title: "Currently Reading",
    description: "Books in progress.",
    sortOrder: 0,
  }),
  makeHomepageSection({
    id: "section-watch",
    title: "Watch Later",
    description: "Videos queued up.",
    sortOrder: 1,
  }),
];

const meta = {
  title: "Components/HomepageSectionsSettings",
  component: HomepageSectionsSettings,
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/homepage-sections", () => HttpResponse.json(sections)),
      ],
    },
  },
} satisfies Meta<typeof HomepageSectionsSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The drag-sortable list of homepage section cards. */
export const Default: Story = {};

/** The empty state — no sections configured yet. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/homepage-sections", () => HttpResponse.json([])),
      ],
    },
  },
};
