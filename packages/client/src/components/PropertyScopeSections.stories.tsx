import type { Meta, StoryObj } from "@storybook/react-vite";

import { propertySchema, valuesFromProperty } from "./propertyFormParts";
import { PropertyCategoriesSection, PropertyMediaTypesSection } from "./PropertyScopeSections";
import { useAppForm } from "../lib/form";
import { makeCustomProperty } from "../test-utils/factories";
import { sampleCategories, sampleMediaTypes } from "../test-utils/story-mocks";

const property = makeCustomProperty({
  id: "prop-priority",
  name: "Priority",
  slug: "priority",
  categoryIds: ["cat-workflow"],
  mediaTypeIds: ["media-article"],
});

/** Builds the shared property form instance the scope sections operate on. */
function CategoriesHost() {
  const form = useAppForm({
    defaultValues: valuesFromProperty(property),
    validators: {
      onChange: propertySchema,
    },
  });
  return (
    <PropertyCategoriesSection
      form={form}
      categories={sampleCategories}
      idPrefix="story-category"
      mode="edit"
      section="categories"
    />
  );
}

function MediaTypesHost() {
  const form = useAppForm({
    defaultValues: valuesFromProperty(property),
    validators: {
      onChange: propertySchema,
    },
  });
  return (
    <PropertyMediaTypesSection
      form={form}
      mediaTypes={sampleMediaTypes}
      idPrefix="story-media"
      section="media-types"
    />
  );
}

const meta = {
  title: "Components/PropertyScopeSections",
  component: CategoriesHost,
} satisfies Meta<typeof CategoriesHost>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The collapsible Categories scope section, expanded. */
export const Categories: Story = {};

/** The collapsible Media Types scope section, expanded. */
export const MediaTypes: Story = {
  render: () => <MediaTypesHost />,
};
