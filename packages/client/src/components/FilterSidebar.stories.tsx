import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterSidebar } from "./FilterSidebar";
import { sampleBookmark, sampleProperties, sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Filters/FilterSidebar",
  component: FilterSidebar,
  args: {
    tree: sampleTagTree,
    properties: sampleProperties,
    bookmarks: [sampleBookmark],
    search: {},
    onSearchChange: () => {},
  },
} satisfies Meta<typeof FilterSidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** No tags and no assigned properties: the rail stays visible with an empty state. */
export const Empty: Story = {
  args: {
    tree: [],
    properties: [],
    bookmarks: [],
  },
};
