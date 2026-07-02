import type { Meta, StoryObj } from "@storybook/react-vite";

import { YouTubeChannelListItem } from "./YouTubeChannelListItem";
import { makeYouTubeChannel } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const channel = makeYouTubeChannel({
  id: "channel-veritasium",
  channelKey: "@veritasium",
  name: "Veritasium",
  slug: "veritasium",
  bookmarkCount: 8,
});

const meta = {
  title: "Components/YouTubeChannelListItem",
  component: YouTubeChannelListItem,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    channel,
  },
} satisfies Meta<typeof YouTubeChannelListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single channel row: avatar, name, bookmark count, and hover Edit / Info. */
export const Default: Story = {};

/** A channel with no bookmarks yet (zero-count, de-emphasized). */
export const NoBookmarks: Story = {
  args: {
    channel: {
      ...channel,
      name: "Unused Channel",
      slug: "unused-channel",
      channelKey: "@unused",
      bookmarkCount: 0,
    },
  },
};

/** Selection mode on — a leading checkbox appears and the row is selected. */
export const Selected: Story = {
  args: {
    selectable: true,
    inSelectionMode: true,
    selected: true,
    onSelectToggle: () => {},
  },
};
