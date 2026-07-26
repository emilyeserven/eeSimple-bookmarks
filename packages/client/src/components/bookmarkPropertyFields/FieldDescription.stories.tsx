import type { Meta, StoryObj } from "@storybook/react-vite";

import { FieldDescription } from "./FieldDescription";

const meta = {
  title: "Components/FieldDescription",
  component: FieldDescription,
  args: {
    text: "The publisher's recommended reading age for this title.",
  },
} satisfies Meta<typeof FieldDescription>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The muted helper line rendered under a property field. */
export const Default: Story = {};

/** With no text, the component renders nothing (nullish text is a no-op). */
export const Empty: Story = {
  args: {
    text: null,
  },
};
