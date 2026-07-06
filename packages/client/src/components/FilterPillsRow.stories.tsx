import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterPillsRow } from "./FilterPillsRow";
import {
  apiHandlers,
  sampleCategories,
  sampleChannels,
  sampleMediaTypes,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

const meta = {
  title: "Filters/FilterPillsRow",
  component: FilterPillsRow,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree: sampleTagTree,
    properties: sampleProperties,
    categories: sampleCategories,
    mediaTypes: sampleMediaTypes,
    youtubeChannels: sampleChannels,
    search: {},
    onSearchChange: () => {},
  },
} satisfies Meta<typeof FilterPillsRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** All pills empty — each shows just the facet name in subtle text. */
export const AllEmpty: Story = {};

/** With active selections — the Category and Tags pills fill and show a summary. */
export const WithSelection: Story = {
  args: {
    search: {
      categories: ["cat-workflow", "cat-content"],
      tagPresence: "missing",
    },
  },
};
