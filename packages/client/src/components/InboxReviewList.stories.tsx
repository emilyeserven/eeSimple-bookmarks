import type { ImportItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { InboxReviewList } from "./InboxReviewList";
import { useInboxReviewController } from "./useInboxReviewController";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

function makeItem(overrides: Partial<ImportItem>): ImportItem {
  return {
    id: "item-1",
    importId: "import-1",
    url: "https://example.com/article",
    rawUrl: "https://example.com/article",
    title: "An interesting article",
    description: "A short summary of the article.",
    imageUrl: null,
    newsletterContext: null,
    anchorText: "read more",
    categoryId: null,
    status: "pending",
    markedForDeletion: false,
    duplicateBookmarkId: null,
    createdBookmarkId: null,
    errorReason: null,
    createdAt: NOW,
    ...overrides,
  };
}

const pendingItems = [
  makeItem({
    id: "item-1",
    title: "An interesting article",
  }),
  makeItem({
    id: "item-2",
    title: "A conference talk worth watching",
    url: "https://example.com/talk",
  }),
];

const processedItems = [
  makeItem({
    id: "item-3",
    title: "Already saved earlier",
    status: "approved",
    createdBookmarkId: "bookmark-github",
  }),
];

const controller = {
  viewMode: "cards",
  columns: 1,
  pendingItems,
  processedItems,
  dismissItem: () => {},
  preFill: {},
  setPreFill: () => {},
  resetPreFill: () => {},
} as unknown as ReturnType<typeof useInboxReviewController>;

const meta = {
  title: "Components/InboxReviewList",
  component: InboxReviewList,
  args: {
    controller,
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof InboxReviewList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Pending and Processed tabs over a pre-fill box; the Pending tab is active. */
export const Default: Story = {};

/** An empty queue — both tabs show their empty messages. */
export const Empty: Story = {
  args: {
    controller: {
      ...controller,
      pendingItems: [],
      processedItems: [],
    } as unknown as ReturnType<typeof useInboxReviewController>,
  },
};
