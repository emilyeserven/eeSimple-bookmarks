import type { Meta, StoryObj } from "@storybook/react-vite";

import { BulkExpandSection } from "./BulkExpandSection";
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
  paramRules: [{
    pathSuffix: "/watch",
    params: ["v"],
  }],
});

const meta = {
  title: "Components/BulkExpandSection",
  component: BulkExpandSection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof BulkExpandSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A website with a verified shortened domain that has an expansion rule. */
export const Default: Story = {};
