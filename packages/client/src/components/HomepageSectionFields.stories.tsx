import type { SectionDisplayValue } from "./SectionDisplaySettings";
import type { ConditionTree } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultCardZoneLayouts, emptyConditionTree, emptyCardFieldZones } from "@eesimple/types";

import { HomepageSectionFields } from "./HomepageSectionFields";
import { apiHandlers, sampleCategories, sampleProperties, sampleTagTree } from "../test-utils/story-mocks";

const display: SectionDisplayValue = {
  viewMode: "cards",
  columns: 2,
  imageMode: "natural",
  imageVisibility: "shown",
  imageLayout: "above",
  fieldZones: emptyCardFieldZones(),
  cardZoneLayouts: defaultCardZoneLayouts(),
  hideWebsiteForYouTube: false,
};

const conditions: ConditionTree = emptyConditionTree();

const meta = {
  title: "Components/HomepageSectionFields",
  component: HomepageSectionFields,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    idPrefix: "section-new",
    title: "Recently added",
    setTitle: () => {},
    description: "The latest links you've saved.",
    setDescription: () => {},
    display,
    onDisplayChange: () => {},
    hideIfEmpty: false,
    setHideIfEmpty: () => {},
    conditions,
    setConditions: () => {},
    displayDefaultOpen: false,
    filterDefaultOpen: false,
    categories: sampleCategories,
    properties: sampleProperties,
    tagTree: sampleTagTree,
  },
} satisfies Meta<typeof HomepageSectionFields>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The General / Display / Filter collapsible sections (only General open). */
export const Default: Story = {};

/** All sections expanded. */
export const AllExpanded: Story = {
  args: {
    displayDefaultOpen: true,
    filterDefaultOpen: true,
  },
};
