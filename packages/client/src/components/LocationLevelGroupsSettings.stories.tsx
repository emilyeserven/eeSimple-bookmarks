import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationLevelGroupsSettings } from "./LocationLevelGroupsSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/LocationLevelGroupsSettings",
  component: LocationLevelGroupsSettings,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof LocationLevelGroupsSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
