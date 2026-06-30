import type { YouTubeChannelHint } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteLookupBanner } from "./WebsiteLookupBanner";

const youtubeChannel: YouTubeChannelHint = {
  key: "@mkbhd",
  name: "Marques Brownlee",
  selfIds: ["MKBHD"],
};

const meta = {
  title: "Components/WebsiteLookupBanner",
  component: WebsiteLookupBanner,
  args: {
    data: {
      exists: true,
      domain: "github.com",
      siteName: "GitHub",
    },
    isYouTube: false,
    youtubeChannel: null,
    onChannelSelfIdsChange: () => {},
    websiteSiteName: "",
    onSiteNameChange: () => {},
    onSiteNameBlur: () => {},
  },
} satisfies Meta<typeof WebsiteLookupBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

/** An existing site — its name is shown next to an "Existing site" badge. */
export const ExistingSite: Story = {};

/** A new, not-yet-saved site — shows the "New site" badge and a site-name input. */
export const NewSite: Story = {
  args: {
    data: {
      exists: false,
      domain: "example.com",
      siteName: null,
    },
    websiteSiteName: "Example",
  },
};

/** A YouTube URL — the detected channel and its self-identifier editor replace the site-name input. */
export const YouTubeChannel: Story = {
  args: {
    data: {
      exists: true,
      domain: "youtube.com",
      siteName: "YouTube",
    },
    isYouTube: true,
    youtubeChannel,
  },
};
