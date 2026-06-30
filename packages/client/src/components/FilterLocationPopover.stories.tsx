import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterLocationPopover } from "./FilterLocationPopover";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Filters/FilterLocationPopover",
  component: FilterLocationPopover,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof FilterLocationPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The closed filter-location trigger; click the funnel to open. */
export const Default: Story = {};

/** Opened by default. */
export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
};
