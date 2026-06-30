import type { ImportItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BlockMenuItems } from "./InboxBlockMenuItems";
import { apiHandlers } from "../test-utils/story-mocks";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NOW = "2026-06-01T00:00:00.000Z";

const item: ImportItem = {
  id: "item-1",
  importId: "import-1",
  url: "https://example.com/sponsored/post",
  rawUrl: "https://example.com/sponsored/post?utm=news",
  title: "A sponsored post",
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
  title: "Components/BlockMenuItems",
  component: BlockMenuItems,
  args: {
    item,
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  render: args => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Block</DropdownMenuTrigger>
      <DropdownMenuContent>
        <BlockMenuItems {...args} />
      </DropdownMenuContent>
    </DropdownMenu>
  ),
} satisfies Meta<typeof BlockMenuItems>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The three block options (URL / domain / page path) for an item with a resolved URL. */
export const Default: Story = {};
