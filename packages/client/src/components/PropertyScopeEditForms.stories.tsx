import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyCategoriesEditForm, PropertyMediaTypesEditForm } from "./PropertyScopeEditForms";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers, sampleCategories, sampleMediaTypes } from "../test-utils/story-mocks";

const property = makeCustomProperty({
  id: "prop-priority",
  name: "Priority",
  slug: "priority",
  categoryIds: ["cat-workflow"],
  mediaTypeIds: ["media-article"],
});

const meta = {
  title: "Components/PropertyScopeEditForms",
  component: PropertyCategoriesEditForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    property,
    categories: sampleCategories,
  },
} satisfies Meta<typeof PropertyCategoriesEditForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Categories scope edit tab — auto-saves the category selection. */
export const Categories: Story = {};

/** Scoped to all categories via the "all categories" flag. */
export const AllCategories: Story = {
  args: {
    property: makeCustomProperty({
      ...property,
      allCategories: true,
      categoryIds: [],
    }),
  },
};

/** The Media Types scope edit tab — auto-saves the media-type selection. */
export const MediaTypes: Story = {
  render: () => (
    <PropertyMediaTypesEditForm
      property={property}
      mediaTypes={sampleMediaTypes}
    />
  ),
};
