import type { Meta, StoryObj } from "@storybook/react-vite";

import { InboxPreFillModals } from "./InboxPreFillModals";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/InboxPreFillModals",
  component: InboxPreFillModals,
  args: {
    preFill: {},
    setPreFill: () => {},
    addPersonOpen: false,
    setAddPersonOpen: () => {},
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof InboxPreFillModals>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The modal closed — nothing is rendered. */
export const Default: Story = {};

/** The "Add person" modal opened from the pre-fill box. */
export const PersonOpen: Story = {
  args: {
    addPersonOpen: true,
  },
};
