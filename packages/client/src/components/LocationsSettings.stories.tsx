import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationsSettings } from "./LocationsSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/LocationsSettings",
  component: LocationsSettings,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof LocationsSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
