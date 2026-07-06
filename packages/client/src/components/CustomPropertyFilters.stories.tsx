import type { Meta, StoryObj } from "@storybook/react-vite";

import { CustomPropertyFilters, PropertyFilterBody } from "./CustomPropertyFilters";
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
    dateTimeValues: {},
    presenceValues: {},
    choicesValues: {},
    onNumberFilterChange: () => {},
    onBooleanFilterChange: () => {},
    onDateTimeFilterChange: () => {},
    onPresenceFilterChange: () => {},
    onChoicesFilterChange: () => {},
    onPropertyReset: () => {},
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

/** A single property's layout-agnostic filter body — the range-slider control plus Reset. */
export const PropertyBody: StoryObj<typeof PropertyFilterBody> = {
  render: args => <PropertyFilterBody {...args} />,
  args: {
    property: sampleProperties[0],
    bookmarks: [sampleBookmark],
    numberValue: undefined,
    booleanValue: undefined,
    dateTimeValue: undefined,
    presenceValue: undefined,
    choicesValue: undefined,
    onNumberFilterChange: () => {},
    onBooleanFilterChange: () => {},
    onDateTimeFilterChange: () => {},
    onChoicesFilterChange: () => {},
    onPropertyReset: () => {},
  },
};
