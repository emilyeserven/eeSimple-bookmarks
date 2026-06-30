import type { Meta, StoryObj } from "@storybook/react-vite";

import { NewsletterIssueBookmarksDialog } from "./NewsletterIssueBookmarksDialog";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const allBookmarks = [
  makeBookmark({
    id: "bm-1",
    title: "Understanding Raft",
    url: "https://example.com/raft",
  }),
  makeBookmark({
    id: "bm-2",
    title: "A Tour of Consensus",
    url: "https://example.com/consensus",
  }),
  makeBookmark({
    id: "bm-3",
    title: "Distributed Systems Reading List",
    url: "https://example.com/reading",
  }),
];

const meta = {
  title: "Components/NewsletterIssueBookmarksDialog",
  component: NewsletterIssueBookmarksDialog,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    importId: "import-1",
    allBookmarks,
    memberIds: ["bm-1"],
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof NewsletterIssueBookmarksDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The dialog open, with one bookmark already attached to the issue. */
export const Default: Story = {};

/** No bookmarks attached yet — every checkbox starts unchecked. */
export const NoMembers: Story = {
  args: {
    memberIds: [],
  },
};
