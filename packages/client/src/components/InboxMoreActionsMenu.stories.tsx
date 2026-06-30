import type { ImportItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { MoreActionsMenu } from "./InboxMoreActionsMenu";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const item: ImportItem = {
  id: "item-1",
  importId: "import-1",
  url: "https://example.com/article",
  rawUrl: "https://example.com/article?utm=news",
  title: "An interesting article",
  description: null,
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
};

const meta = {
  title: "Components/MoreActionsMenu",
  component: MoreActionsMenu,
  args: {
    item,
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof MoreActionsMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The kebab "More" menu with Block URL, Mark as shortener, Recheck, and Import submenus. */
export const Default: Story = {};

/** An item with no resolved URL hides the URL-dependent actions. */
export const NoUrl: Story = {
  args: {
    item: {
      ...item,
      url: null,
    },
  },
};
