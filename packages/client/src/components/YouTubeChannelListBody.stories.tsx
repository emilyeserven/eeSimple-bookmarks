import type { Meta, StoryObj } from "@storybook/react-vite";

import { YouTubeChannelListBody } from "./YouTubeChannelListBody";
import { apiHandlers, sampleChannels } from "../test-utils/story-mocks";

const meta = {
  title: "Components/YouTubeChannelListBody",
  component: YouTubeChannelListBody,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    filtered: sampleChannels,
  },
} satisfies Meta<typeof YouTubeChannelListBody>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The card-grid body of the channels listing, with its bulk-select bar. */
export const Default: Story = {};

/** No channels match — the body renders nothing. */
export const Empty: Story = {
  args: {
    filtered: [],
  },
};
