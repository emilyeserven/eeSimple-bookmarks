import type { Meta, StoryObj } from "@storybook/react-vite";

import { LinkPreview } from "./LinkPreview";
import { makeWebsite } from "../test-utils/factories";

const sampleWebsites = [
  makeWebsite({
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
  }),
];

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
