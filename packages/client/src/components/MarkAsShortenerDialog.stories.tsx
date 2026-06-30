import type { ImportItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { MarkAsShortenerDialog } from "./MarkAsShortenerDialog";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const item: ImportItem = {
  id: "item-1",
  importId: "import-1",
  url: "https://bit.ly/abc123",
  rawUrl: "https://bit.ly/abc123",
  title: "A shortened link",
  description: null,
  imageUrl: null,
  newsletterContext: null,
  anchorText: null,
  categoryId: null,
  status: "pending",
  markedForDeletion: false,
  duplicateBookmarkId: null,
  createdBookmarkId: null,
  errorReason: null,
  createdAt: NOW,
};

const meta = {
  title: "Components/MarkAsShortenerDialog",
  component: MarkAsShortenerDialog,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    item,
    open: true,
    onClose: () => {},
  },
} satisfies Meta<typeof MarkAsShortenerDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The dialog defaulting to the generic shortener ignore-list tab. */
export const Default: Story = {};

/** Opened on the "Associate with website" tab. */
export const WebsiteMode: Story = {
  args: {
    initialMode: "website",
  },
};
