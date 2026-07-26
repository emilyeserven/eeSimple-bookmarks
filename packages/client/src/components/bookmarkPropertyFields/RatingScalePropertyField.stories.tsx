import type { Meta, StoryObj } from "@storybook/react-vite";

import { RatingScalePropertyField } from "./RatingScalePropertyField";
import { makeCustomProperty } from "../../test-utils/factories";

const property = makeCustomProperty({
  id: "rating",
  name: "My rating",
  slug: "my-rating",
  type: "ratingScale",
  ratingMax: 5,
  ratingDisplay: "stars",
  description: "How much you enjoyed it.",
});

const meta = {
  title: "Components/RatingScalePropertyField",
  component: RatingScalePropertyField,
  args: {
    property,
    raw: "4",
    onChange: () => {},
  },
} satisfies Meta<typeof RatingScalePropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A 5-star rating with 4 filled. */
export const Default: Story = {};

/** A half-star-capable rating showing 3.5 of 5. */
export const HalfStars: Story = {
  args: {
    property: makeCustomProperty({
      id: "rating",
      name: "My rating",
      slug: "my-rating",
      type: "ratingScale",
      ratingMax: 5,
      ratingDisplay: "stars",
      ratingAllowHalf: true,
      description: null,
    }),
    raw: "3.5",
  },
};

/** An unset rating (no value yet). */
export const Empty: Story = {
  args: {
    raw: undefined,
  },
};
