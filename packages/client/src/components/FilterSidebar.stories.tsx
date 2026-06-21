import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterSidebar } from "./FilterSidebar";
import { makeCustomProperty } from "../test-utils/factories";
import {
  sampleBookmark,
  sampleCategories,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

const meta = {
  title: "Filters/FilterSidebar",
  component: FilterSidebar,
  args: {
    tree: sampleTagTree,
    properties: sampleProperties,
    categories: sampleCategories,
    bookmarks: [sampleBookmark],
    search: {},
    onSearchChange: () => {},
  },
} satisfies Meta<typeof FilterSidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Bookmarks page: flat properties with category tooltips and the Category filter accordion. */
export const Default: Story = {};

/** No tags and no assigned properties: the rail stays visible with an empty state. */
export const Empty: Story = {
  args: {
    tree: [],
    properties: [],
    categories: [],
    bookmarks: [],
  },
};

/** A property with no categories triggers the uncategorized error at the bottom of the rail. */
export const WithUnassignedProperty: Story = {
  args: {
    properties: [
      ...sampleProperties,
      makeCustomProperty({
        id: "prop-orphan",
        name: "Orphaned",
        slug: "orphaned",
        type: "boolean",
      }),
    ],
  },
};

/** Category pages omit the `categories` prop, so the rail renders flat with no Category filter. */
export const CategoryPage: Story = {
  args: {
    categories: undefined,
    properties: sampleProperties.filter(p => p.categoryIds.includes("cat-workflow")),
  },
};
