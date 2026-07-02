import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { UrlCleanupPanel } from "./BookmarkUrlCleanupPanel";
import { makeWebsite } from "../test-utils/factories";

const websites: Website[] = [
  makeWebsite({
    id: "site-youtube",
    domain: "youtube.com",
    siteName: "YouTube",
    slug: "youtube",
    builtIn: true,
    paramRules: [{
      pathSuffix: "/watch",
      params: ["v"],
    }],
  }),
];

const meta = {
  title: "Bookmarks/UrlCleanupPanel",
  component: UrlCleanupPanel,
  args: {
    url: "https://youtube.com/watch?v=abc123&utm_source=newsletter&feature=share",
    cleanupId: "story-cleanup",
    mode: "trackers",
    onModeChange: () => {},
    websites,
    ignoreList: [],
    customStripParams: [],
  },
} satisfies Meta<typeof UrlCleanupPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** "All params" mode — strips everything except the site's whitelisted params. */
export const AllParams: Story = {
  args: {
    mode: "all",
  },
};

/** "No modification" mode — the preview equals the original URL. */
export const NoModification: Story = {
  args: {
    mode: "none",
  },
};
