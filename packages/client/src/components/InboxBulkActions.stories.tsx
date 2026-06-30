import type { Meta, StoryObj } from "@storybook/react-vite";

import { InboxBulkActions } from "./InboxBulkActions";

const meta = {
  title: "Components/InboxBulkActions",
  component: InboxBulkActions,
  args: {
    pendingCount: 8,
    rejectedCount: 3,
    addedCount: 5,
    blockedCount: 1,
    bulkRunning: false,
    rejectPendingIsPending: false,
    recheckPendingIsPending: false,
    deleteRejectedIsPending: false,
    deleteAddedIsPending: false,
    deleteBlockedIsPending: false,
    onApproveAll: () => Promise.resolve(),
    onRejectAll: () => {},
    onRecheckBlocklist: () => {},
    onDeleteRejected: () => {},
    onDeleteAdded: () => {},
    onDeleteBlocked: () => {},
  },
} satisfies Meta<typeof InboxBulkActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Bulk Actions dropdown with pending, rejected, added, and blocked counts. */
export const Default: Story = {};

/** Nothing to act on — every item is disabled. */
export const AllEmpty: Story = {
  args: {
    pendingCount: 0,
    rejectedCount: 0,
    addedCount: 0,
    blockedCount: 0,
  },
};

/** A bulk approve is in flight — the approve item shows its busy label. */
export const BulkRunning: Story = {
  args: {
    bulkRunning: true,
  },
};
