import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteShortenedLinksForm } from "./WebsiteShortenedLinksForm";
import { makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const website = makeWebsite({
  id: "site-youtube",
  domain: "youtube.com",
  siteName: "YouTube",
  slug: "youtube",
  builtIn: true,
  shortenedLinks: [
    {
      domain: "youtu.be",
      expandTo: "https://www.youtube.com/watch?v={id}",
      keepShortened: false,
    },
  ],
  bookmarkCount: 18,
});

const meta = {
  title: "Components/WebsiteShortenedLinksForm",
  component: WebsiteShortenedLinksForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof WebsiteShortenedLinksForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The shortened-links editor with a preview and bulk-expand section (an expandable short domain). */
export const Default: Story = {};

/** A site with no shortened links configured yet. */
export const NoLinks: Story = {
  args: {
    website: {
      ...website,
      shortenedLinks: [],
    },
  },
};
