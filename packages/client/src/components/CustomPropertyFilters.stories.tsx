import type { Meta, StoryObj } from "@storybook/react-vite";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

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
