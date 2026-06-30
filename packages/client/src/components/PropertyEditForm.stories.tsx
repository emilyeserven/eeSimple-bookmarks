import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyEditForm } from "./PropertyEditForm";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const property = makeCustomProperty({
  id: "prop-rating",
  name: "Rating",
  slug: "rating",
  type: "ratingScale",
  ratingMax: 5,
  description: "How much you liked it.",
});

const meta = {
  title: "Components/PropertyEditForm",
  component: PropertyEditForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    property,
    section: "general",
  },
} satisfies Meta<typeof PropertyEditForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The General edit tab — name, status, and description, each auto-saving. */
export const General: Story = {};

/** The Options edit tab for a rating property. */
export const Options: Story = {
  args: {
    section: "options",
  },
};

/** The Display edit tab — grouping and "Show in…" toggles. */
export const Display: Story = {
  args: {
    section: "display",
  },
};
