import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterSidebar } from "./FilterSidebar";
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
      {
        id: "prop-orphan",
        name: "Orphaned",
        slug: "orphaned",
        type: "boolean" as const,
        builtIn: false,
        numberFormat: null,
        dateTimeFormat: null,
        description: null,
        numberMin: null,
        numberMax: null,
        unitSingular: null,
        unitPlural: null,
        valuePrefix: null,
        zeroLabel: null,
        maxLabel: null,
        operandPropertyIds: [],
        categoryIds: [],
        showInForm: false,
        hiddenFromForm: false,
        showInListings: true,
        allCategories: false,
        mediaTypeIds: [],
        allMediaTypes: false,
        editableOnCard: false,
        enabled: true,
        allowDefault: true,
        showIfFalse: false,
        booleanLabelPreset: null,
        booleanTrueLabel: null,
        booleanFalseLabel: null,
        showLabelColon: true,
        showValueBeforeLabel: false,
        hideLabel: false,
        clickableInView: false,
        ratingMax: null,
        ratingAllowZero: false,
        ratingAllowHalf: false,
        ratingShowLabel: false,
        ratingLabel: null,
        propertyGroupId: null,
        createdAt: "2026-06-01T00:00:00.000Z",
      },
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
