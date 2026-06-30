import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyPreview } from "./PropertyPreview";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers, sampleProperties } from "../test-utils/story-mocks";

const property = makeCustomProperty({
  id: "prop-priority",
  name: "Priority",
  slug: "priority",
  type: "number",
  description: "How urgently this should be read.",
  numberMin: 0,
  numberMax: 10,
  categoryIds: ["cat-workflow"],
});

const meta = {
  title: "Components/PropertyPreview",
  component: PropertyPreview,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    property,
    allProperties: sampleProperties,
  },
} satisfies Meta<typeof PropertyPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A custom number property scoped to one category. */
export const Default: Story = {};

/** A built-in, disabled property that applies to all categories. */
export const BuiltInDisabled: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-rating",
      name: "Rating",
      slug: "rating",
      type: "ratingScale",
      builtIn: true,
      enabled: false,
      allCategories: true,
    }),
  },
};

/** In selection mode the card toggles selection instead of navigating. */
export const Selectable: Story = {
  args: {
    selectable: true,
    inSelectionMode: true,
    selected: true,
    onSelectToggle: () => {},
  },
};
