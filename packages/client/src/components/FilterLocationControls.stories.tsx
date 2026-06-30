import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterLocationControls } from "./FilterLocationControls";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Filters/FilterLocationControls",
  component: FilterLocationControls,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof FilterLocationControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Sidebar / Drawer / Hide chooser for where the filter panel appears. */
export const Default: Story = {};
