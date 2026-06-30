import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyOptionsEditForm } from "./PropertyOptionsEditForm";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const numberProperty = makeCustomProperty({
  id: "prop-pages",
  name: "Pages",
  slug: "pages",
  type: "number",
  numberMin: 0,
  numberMax: 500,
  unitSingular: "page",
  unitPlural: "pages",
});

const meta = {
  title: "Components/PropertyOptionsEditForm",
  component: PropertyOptionsEditForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    property: numberProperty,
    numberProperties: [],
  },
} satisfies Meta<typeof PropertyOptionsEditForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Options edit tab for a Number property — each type-specific option auto-saves. */
export const NumberOptions: Story = {};

/** The Options edit tab for a rating-scale property. */
export const RatingOptions: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-rating",
      name: "Rating",
      slug: "rating",
      type: "ratingScale",
      ratingMax: 5,
    }),
  },
};
