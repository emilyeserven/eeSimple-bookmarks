import type { Meta, StoryObj } from "@storybook/react-vite";

import { CopyJsonButton } from "./CopyJsonButton";

const meta = {
  title: "Components/CopyJsonButton",
  component: CopyJsonButton,
  args: {
    data: {
      id: "abc",
      title: "Example bookmark",
      tags: ["research", "reading"],
    },
  },
} satisfies Meta<typeof CopyJsonButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The button with a custom label instead of the default. */
export const CustomLabel: Story = {
  args: {
    label: "Copy debug payload",
  },
};
