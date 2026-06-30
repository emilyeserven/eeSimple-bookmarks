import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationPinStyleSettings } from "./LocationPinStyleSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/LocationPinStyleSettings",
  component: LocationPinStyleSettings,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof LocationPinStyleSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
