import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteYouTubeChannelsField } from "./WebsiteYouTubeChannelsField";
import { apiHandlers, sampleChannels } from "../test-utils/story-mocks";

const meta = {
  title: "Components/WebsiteYouTubeChannelsField",
  component: WebsiteYouTubeChannelsField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    channels: sampleChannels,
    selectedIds: [],
    onChange: () => {},
  },
} satisfies Meta<typeof WebsiteYouTubeChannelsField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No channels selected yet. */
export const Default: Story = {};

/** One channel already associated with the website. */
export const WithSelection: Story = {
  args: {
    selectedIds: [sampleChannels[0].id],
  },
};
