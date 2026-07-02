import type { HomepageSection } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";

import { HomepageSectionView } from "./HomepageSectionView";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const section: HomepageSection = {
  id: "section-reading",
  title: "Currently Reading",
  description: "Books and long-reads in progress.",
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
  sort: null,
  createdAt: NOW,
};

const meta = {
  title: "Components/HomepageSectionView",
  component: HomepageSectionView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    section,
    onPatchDisplay: () => {},
  },
} satisfies Meta<typeof HomepageSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Read-only Display + Filter summary with a description. */
export const Default: Story = {};

/** A section with no description and no filter conditions. */
export const NoDescriptionNoFilter: Story = {
  args: {
    section: {
      ...section,
      description: null,
    },
  },
};
