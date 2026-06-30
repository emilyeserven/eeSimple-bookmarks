import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyOptionsFields } from "./PropertyDetail";
import { makeCustomProperty } from "../test-utils/factories";

const meta = {
  title: "Components/PropertyOptionsFields",
  component: PropertyOptionsFields,
  args: {
    property: makeCustomProperty({
      id: "rating",
      name: "Rating",
      slug: "rating",
      type: "ratingScale",
      ratingMax: 5,
      ratingAllowHalf: true,
      ratingShowLabel: true,
      ratingLabel: "My rating",
    }),
  },
} satisfies Meta<typeof PropertyOptionsFields>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The per-type options body for a rating-scale property. */
export const RatingScale: Story = {};

/** A choices property: display type, selection mode, and the defined choices. */
export const Choices: Story = {
  args: {
    property: makeCustomProperty({
      id: "status",
      name: "Status",
      slug: "status",
      type: "choices",
      choicesDisplay: "dropdown",
      choicesMultiple: false,
      choicesItems: [
        {
          label: "To read",
          value: "to-read",
        },
        {
          label: "Done",
          value: "done",
          isDefault: true,
        },
      ],
    }),
  },
};

/** A datetime property: what the value captures plus the default allowance. */
export const DateTime: Story = {
  args: {
    property: makeCustomProperty({
      id: "posted",
      name: "Date posted",
      slug: "date-posted",
      type: "datetime",
      dateTimeFormat: "datetime",
    }),
  },
};
