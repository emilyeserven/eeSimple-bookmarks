import type { Meta, StoryObj } from "@storybook/react-vite";

import { RulePropertyField } from "./RulePropertyField";
import { makeCustomProperty } from "../test-utils/factories";

const meta = {
  title: "Components/RulePropertyField",
  component: RulePropertyField,
  args: {
    property: makeCustomProperty({
      id: "prop-pages",
      name: "Pages",
      slug: "pages",
      type: "number",
      unitPlural: "pages",
    }),
    numberInputs: {},
    booleanInputs: {},
    dateTimeInputs: {},
    onNumberChange: () => {},
    onBooleanChange: () => {},
    onDateTimeChange: () => {},
  },
} satisfies Meta<typeof RulePropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A number property renders a numeric input with its unit in the label. */
export const Number: Story = {
  args: {
    numberInputs: {
      "prop-pages": "320",
    },
  },
};

/** A datetime property renders a date/time picker. */
export const DateTime: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-released",
      name: "Released",
      slug: "released",
      type: "datetime",
      dateTimeFormat: "date",
    }),
  },
};

/** A rating-scale property renders a star rating. */
export const Rating: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-rating",
      name: "Rating",
      slug: "rating",
      type: "ratingScale",
      ratingMax: 5,
    }),
    numberInputs: {
      "prop-rating": "4",
    },
  },
};

/** A boolean property renders a checkbox. */
export const Boolean: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-fav",
      name: "Favorite",
      slug: "favorite",
      type: "boolean",
    }),
    booleanInputs: {
      "prop-fav": true,
    },
  },
};
