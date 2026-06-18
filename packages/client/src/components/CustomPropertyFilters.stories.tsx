import type { Meta, StoryObj } from "@storybook/react-vite";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import {
  apiHandlers,
  sampleBookmark,
  sampleCategories,
  sampleProperties,
} from "../test-utils/story-mocks";

const meta = {
  title: "Settings/CustomPropertyFilters",
  component: CustomPropertyFilters,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    properties: sampleProperties,
    categories: sampleCategories,
    bookmarks: [sampleBookmark],
    numberValues: {},
    booleanValues: {},
    presenceValues: {},
    onNumberFilterChange: () => {},
    onBooleanFilterChange: () => {},
    onPresenceFilterChange: () => {},
  },
} satisfies Meta<typeof CustomPropertyFilters>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Shows category-tooltip icons on each property header. */
export const WithCategoryTooltips: Story = {
  args: {
    categories: sampleCategories,
  },
};

/** One category selected: properties from other categories are dimmed and moved to the bottom. */
export const CategoryFilterActive: Story = {
  args: {
    categories: sampleCategories,
    selectedCategoryIds: ["cat-workflow"],
  },
};
