import type { HomepageSection } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { HomepageSectionsSettings } from "./HomepageSectionsSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

function makeSection(overrides: Partial<HomepageSection>): HomepageSection {
  return {
    id: "section-1",
    title: "Section",
    description: null,
    conditions: emptyConditionTree(),
    sortOrder: 0,
    hideIfEmpty: false,
    columns: 3,
    imageMode: "natural",
    imageLayout: "above",
    imageVisibility: "shown",
    viewMode: "cards",
    fieldZones: null,
    cardZoneLayouts: defaultCardZoneLayouts(),
    hiddenCardFields: [],
    cornerOverlays: false,
    hideWebsiteForYouTube: false,
    createdAt: NOW,
    ...overrides,
  };
}

const sections: HomepageSection[] = [
  makeSection({
    id: "section-reading",
    title: "Currently Reading",
    description: "Books in progress.",
    sortOrder: 0,
  }),
  makeSection({
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
