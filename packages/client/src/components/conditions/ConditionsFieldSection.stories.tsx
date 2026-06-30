import type { Meta, StoryObj } from "@storybook/react-vite";

import { Section } from "./ConditionsFieldSection";

const meta = {
  title: "Components/Conditions/ConditionsFieldSection",
  component: Section,
  args: {
    title: "Category",
    children: (
      <p className="text-sm text-muted-foreground">
        The section&apos;s fields render here once expanded.
      </p>
    ),
  },
  decorators: [Story => (
    <div className="max-w-md">
      <Story />
    </div>
  )],
} satisfies Meta<typeof Section>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed by default — a trigger row showing only the title. */
export const Collapsed: Story = {};

/** A summary count beside the title hints at how many values are set. */
export const WithSummary: Story = {
  args: {
    summary: "3 selected",
  },
};

/** Pre-expanded, revealing the section body. */
export const Open: Story = {
  args: {
    defaultOpen: true,
  },
};
