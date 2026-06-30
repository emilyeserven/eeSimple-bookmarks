import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomepageSectionTable } from "./HomepageSectionTable";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const bookmarks = [
  sampleBookmark,
  makeBookmark({
    id: "bm-vite",
    title: "Vite",
    url: "https://vitejs.dev",
    description: "Next generation frontend tooling.",
  }),
  makeBookmark({
    id: "bm-tanstack",
    title: "TanStack Query",
    url: "https://tanstack.com/query",
    description: "Powerful asynchronous state management.",
  }),
];

const meta = {
  title: "Components/HomepageSectionTable",
  component: HomepageSectionTable,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmarks,
    customProperties: [],
    hiddenFields: new Set<string>(),
    imageMode: "natural",
    imageVisibility: "shown",
    hideWebsiteForYouTube: false,
  },
} satisfies Meta<typeof HomepageSectionTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A sortable data table of a homepage section's matching bookmarks. */
export const Default: Story = {};

/** Empty section — no matching bookmarks. */
export const Empty: Story = {
  args: {
    bookmarks: [],
  },
};
