import type { Meta, StoryObj } from "@storybook/react-vite";

import { YouTubeChannelsListing } from "./YouTubeChannelManager";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/YouTubeChannelsListing",
  component: YouTubeChannelsListing,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof YouTubeChannelsListing>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
