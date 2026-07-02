import type { Meta, StoryObj } from "@storybook/react-vite";

import { YouTubeChannelGeneralForm } from "./YouTubeChannelGeneralForm";
import { makeYouTubeChannel } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const channel = makeYouTubeChannel({
  id: "channel-veritasium",
  channelKey: "@veritasium",
  name: "Veritasium",
  slug: "veritasium",
  selfIds: ["Veritasium"],
  bookmarkCount: 3,
});

const meta = {
  title: "Components/YouTubeChannelGeneralForm",
  component: YouTubeChannelGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    channel,
  },
} satisfies Meta<typeof YouTubeChannelGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A channel's General edit tab — name, avatar, defaults, self-ids, tags, and websites, all auto-saving. */
export const Default: Story = {};
