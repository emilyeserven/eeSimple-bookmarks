import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyDisplayEditForm } from "./PropertyDisplayEditForm";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/PropertyDisplayEditForm",
  component: PropertyDisplayEditForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    property: makeCustomProperty({
      id: "rating",
      name: "Rating",
      slug: "rating",
      type: "ratingScale",
    }),
  },
} satisfies Meta<typeof PropertyDisplayEditForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Display edit tab; each control auto-saves on change (no Save button). */
export const Default: Story = {};

/** A text property. */
export const TextProperty: Story = {
  args: {
    property: makeCustomProperty({
      id: "notes",
      name: "Notes",
      slug: "notes",
      type: "text",
    }),
  },
};
