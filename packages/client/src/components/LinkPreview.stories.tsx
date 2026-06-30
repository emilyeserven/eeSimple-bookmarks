import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LinkPreview } from "./LinkPreview";

const NOW = "2026-06-01T00:00:00.000Z";

const sampleWebsites = [
  {
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
    builtIn: false,
    shortenedLinks: [],
    paramRules: [],
    socialLinks: [],
    alternateNames: [],
    createdAt: NOW,
  },
] satisfies Website[];

const meta = {
  title: "Components/LinkPreview",
  component: LinkPreview,
  args: {
    websites: sampleWebsites,
    ignoreList: ["bit.ly", "t.co"],
    customStripParams: ["ref"],
  },
} satisfies Meta<typeof LinkPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Empty input — only the URL field is shown until something is pasted. */
export const Default: Story = {};

/** A scoped, custom-labeled preview for a single site. */
export const SingleSiteScope: Story = {
  args: {
    label: "Preview a GitHub link",
    placeholder: "https://github.com/…",
  },
};
