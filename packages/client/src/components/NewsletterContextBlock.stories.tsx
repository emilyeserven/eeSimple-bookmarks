import type { Meta, StoryObj } from "@storybook/react-vite";

import { NewsletterContextBlock } from "./NewsletterContextBlock";

const CONTEXT
  = "We spent the week reading about distributed systems. Our favorite was a deep dive into consensus algorithms that finally made Raft click for the whole team.";

const meta = {
  title: "Components/NewsletterContextBlock",
  component: NewsletterContextBlock,
  args: {
    context: CONTEXT,
    anchorText: "consensus algorithms",
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof NewsletterContextBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The expanded captured passage with the link's anchor text bolded. */
export const Default: Story = {};

/** Collapsed — only the "Context" trigger is visible. */
export const Collapsed: Story = {
  args: {
    open: false,
  },
};

/** No anchor text to highlight; the whole passage renders plain. */
export const NoAnchor: Story = {
  args: {
    anchorText: null,
  },
};
