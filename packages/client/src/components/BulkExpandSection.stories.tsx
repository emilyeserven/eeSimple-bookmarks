import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BulkExpandSection } from "./BulkExpandSection";
import { apiHandlers } from "../test-utils/story-mocks";

const website: Website = {
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
  createdAt: "2026-06-01T00:00:00.000Z",
  socialLinks: [],
  alternateNames: [],
};

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
