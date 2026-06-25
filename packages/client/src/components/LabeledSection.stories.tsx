import type { Meta, StoryObj } from "@storybook/react-vite";

import { LabeledSection } from "./LabeledSection";

const meta = {
  title: "Components/LabeledSection",
  component: LabeledSection,
  args: {
    title: "General",
    description: "Basic details for this entity.",
    children: <div className="rounded-md border p-4 text-sm">Section content goes here.</div>,
  },
} satisfies Meta<typeof LabeledSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: {
    description: undefined,
  },
};
