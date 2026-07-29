import type { ImportItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RowActions } from "./InboxRowActions";
import { makeImportItem } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

function makeItem(overrides: Partial<ImportItem>): ImportItem {
  return makeImportItem({
    id: "item-1",
    importId: "import-1",
    title: "An interesting article",
    anchorText: "read more",
    ...overrides,
  });
}

const meta = {
  title: "Components/InboxRowActions",
  component: RowActions,
  args: {
    item: makeItem({}),
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof RowActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A pending item: approve + reject buttons plus the More menu. */
export const Pending: Story = {};

/** A rejected item: a restore-to-pending button plus the More menu. */
export const Rejected: Story = {
  args: {
    item: makeItem({
      status: "rejected",
    }),
  },
};

/** An approved item: a "View bookmark" link plus the More menu. */
export const Approved: Story = {
  args: {
    item: makeItem({
      status: "approved",
      createdBookmarkId: "bookmark-github",
    }),
  },
};
