import type { YouTubeChannel } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { YouTubeChannelGeneralForm } from "./YouTubeChannelGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const channel: YouTubeChannel = {
  id: "channel-veritasium",
  channelKey: "@veritasium",
  name: "Veritasium",
  slug: "veritasium",
  selfIds: ["Veritasium"],
  createdAt: "2026-06-01T00:00:00.000Z",
  bookmarkCount: 3,
  imageUrl: null,
  category: null,
  tagIds: [],
  mediaTypeId: null,
  websiteIds: [],
};

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
