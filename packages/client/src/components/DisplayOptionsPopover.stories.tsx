import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisplayOptionsPopover } from "./DisplayOptionsPopover";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/DisplayOptionsPopover",
  component: DisplayOptionsPopover,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    pageKey: "bookmarks",
  },
} satisfies Meta<typeof DisplayOptionsPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The closed Display popover trigger; click the eye to open the controls. */
export const Default: Story = {};

/** Opened by default. */
export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
};
