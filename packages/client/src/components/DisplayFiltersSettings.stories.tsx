import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisplayFiltersSettings } from "./DisplayFiltersSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/DisplayFiltersSettings",
  component: DisplayFiltersSettings,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof DisplayFiltersSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
