import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryDefaultField } from "./CategoryDefaultField";
import { makeCustomProperty } from "../test-utils/factories";

const numberProperty = makeCustomProperty({
  id: "pages",
  name: "Pages",
  slug: "pages",
  type: "number",
  unitPlural: "pages",
});

const meta = {
  title: "Components/CategoryDefaultField",
  component: CategoryDefaultField,
  render: args => (
    <div className="w-64">
      <CategoryDefaultField {...args} />
    </div>
  ),
  args: {
    category: {
      id: "cat",
    },
    property: numberProperty,
    numberInputs: {
      pages: "120",
    },
    booleanInputs: {},
    dateTimeInputs: {},
    onNumberChange: () => {},
    onBooleanChange: () => {},
    onDateTimeChange: () => {},
  },
} satisfies Meta<typeof CategoryDefaultField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A number-typed default value. */
export const NumberField: Story = {};

/** A date-time-typed default value. */
export const DateTimeField: Story = {
  args: {
    property: makeCustomProperty({
      id: "published",
      name: "Published",
      slug: "published",
      type: "datetime",
      dateTimeFormat: "date",
    }),
    dateTimeInputs: {
      published: "2026-01-15",
    },
  },
};

/** A rating-scale default value (stars). */
export const RatingField: Story = {
  args: {
    property: makeCustomProperty({
      id: "rating",
      name: "Rating",
      slug: "rating",
      type: "ratingScale",
      ratingMax: 5,
    }),
    numberInputs: {
      rating: "4",
    },
  },
};

/** A boolean default with a Yes/No/No-default select. */
export const BooleanField: Story = {
  args: {
    property: makeCustomProperty({
      id: "favorite",
      name: "Favorite",
      slug: "favorite",
      type: "boolean",
    }),
    booleanInputs: {
      favorite: true,
    },
  },
};
