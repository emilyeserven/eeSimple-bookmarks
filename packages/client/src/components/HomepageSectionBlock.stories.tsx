import type { HomepageSection } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { HomepageSectionBlock } from "./HomepageSectionBlock";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

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
  createdAt: NOW,
};

const meta = {
  title: "Components/HomepageSectionBlock",
  component: HomepageSectionBlock,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/card-display-rules", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
  args: {
    data: {
      section,
      bookmarks: [sampleBookmark],
    },
    customProperties: sampleProperties,
  },
} satisfies Meta<typeof HomepageSectionBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A populated cards section. */
export const Default: Story = {};

/** A section in table view. */
export const TableView: Story = {
  args: {
    data: {
      section: {
        ...section,
        viewMode: "table",
      },
      bookmarks: [sampleBookmark],
    },
    customProperties: sampleProperties,
  },
};

/** A section whose filter matches nothing. */
export const Empty: Story = {
  args: {
    data: {
      section,
      bookmarks: [],
    },
    customProperties: sampleProperties,
  },
};
