import type { HomepageSection } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { HomepageSectionCard } from "./HomepageSectionCard";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const section: HomepageSection = {
  id: "section-recent",
  title: "Recently added",
  description: "The latest links you've saved.",
  conditions: emptyConditionTree(),
  sortOrder: 0,
  hideIfEmpty: false,
  columns: 2,
  imageMode: "natural",
  imageLayout: "above",
  imageVisibility: "shown",
  viewMode: "cards",
  fieldZones: null,
  cardZoneLayouts: null,
  hiddenCardFields: [],
  cornerOverlays: false,
  hideWebsiteForYouTube: false,
  sort: null,
  bookmarkLimit: null,
  createdAt: NOW,
};

const meta = {
  title: "Components/HomepageSectionCard",
  component: HomepageSectionCard,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/card-display-rules", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
  args: {
    section,
  },
} satisfies Meta<typeof HomepageSectionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A collapsed section row in the settings list (drag handle, edit, expand). */
export const Collapsed: Story = {};

/** A section that hides itself when empty (shows the EyeOff indicator). */
export const HidesWhenEmpty: Story = {
  args: {
    section: {
      ...section,
      title: "Unread",
      hideIfEmpty: true,
    },
  },
};

/** Rendered mid-drag (elevated shadow). */
export const Dragging: Story = {
  args: {
    isDragging: true,
  },
};
