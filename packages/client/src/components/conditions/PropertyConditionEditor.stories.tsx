import type { PropertyCondition } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { PropertyConditionEditor } from "./PropertyConditionEditor";
import { makeCategory, makeCustomProperty } from "../../test-utils/factories";

const categories = [
  makeCategory({
    id: "cat-articles",
    name: "Articles",
    slug: "articles",
  }),
  makeCategory({
    id: "cat-videos",
    name: "Videos",
    slug: "videos",
  }),
];

/** One property of every value kind, all assigned to the "Articles" category. */
const properties = [
  makeCustomProperty({
    id: "p-rating",
    name: "Rating",
    slug: "rating",
    type: "ratingScale",
    ratingMax: 5,
    categoryIds: ["cat-articles"],
  }),
  makeCustomProperty({
    id: "p-price",
    name: "Price",
    slug: "price",
    type: "number",
    numberMin: 0,
    numberMax: 500,
    categoryIds: ["cat-articles"],
  }),
  makeCustomProperty({
    id: "p-published",
    name: "Published",
    slug: "published",
    type: "datetime",
    dateTimeFormat: "date",
    categoryIds: ["cat-articles"],
  }),
  makeCustomProperty({
    id: "p-favorite",
    name: "Favorite",
    slug: "favorite",
    type: "boolean",
    categoryIds: ["cat-articles"],
  }),
  makeCustomProperty({
    id: "p-attachment",
    name: "Attachment",
    slug: "attachment",
    type: "file",
    categoryIds: ["cat-articles"],
  }),
];

const meta = {
  title: "Conditions/PropertyConditionEditor",
  component: PropertyConditionEditor,
  args: {
    value: [],
    properties,
    categories,
    selectedCategoryIds: [],
    onChange: () => {},
  },
} satisfies Meta<typeof PropertyConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A mixed property set with no category filter — every row is active. */
export const AllValueKinds: Story = {
  render: () => {
    const [value, setValue] = useState<PropertyCondition[]>([]);
    return (
      <div className="max-w-md">
        <PropertyConditionEditor
          value={value}
          properties={properties}
          categories={categories}
          selectedCategoryIds={[]}
          onChange={setValue}
        />
      </div>
    );
  },
};

/**
 * A category filter is active, so properties not assigned to it collapse into the "Other
 * Properties" section. Here only the rating belongs to "Videos"; the rest become inactive.
 */
export const WithOtherPropertiesSection: Story = {
  render: () => {
    const [value, setValue] = useState<PropertyCondition[]>([]);
    const mixed = properties.map(property =>
      property.id === "p-rating"
        ? {
          ...property,
          categoryIds: ["cat-videos"],
        }
        : property);
    return (
      <div className="max-w-md">
        <PropertyConditionEditor
          value={value}
          properties={mixed}
          categories={categories}
          selectedCategoryIds={["cat-videos"]}
          onChange={setValue}
        />
      </div>
    );
  },
};
