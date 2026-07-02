import type { Meta, StoryObj } from "@storybook/react-vite";

import { ReviewRowHoverShell, SwipeableReviewCard } from "./ReviewRowShell";

import { RowCard } from "@/components/ui/card";

const meta = {
  title: "Components/ReviewRowShell",
  component: ReviewRowHoverShell,
  args: {
    hoverId: "bookmark-1",
    children: (
      <RowCard className="p-4">Approved inbox item mapped to a bookmark — hover for the ⌘K hint.</RowCard>
    ),
  },
} satisfies Meta<typeof ReviewRowHoverShell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A row with a created bookmark: hovering reveals the "⌘K to edit" hint. */
export const WithHoverHint: Story = {};

/** A row with no created bookmark renders its children unchanged. */
export const NoCreatedBookmark: Story = {
  args: {
    hoverId: null,
  },
};

const idleSwipe = {
  displacement: 0,
  onTouchStart: () => {},
  onTouchMove: () => {},
  onTouchEnd: () => {},
};

/** The mobile swipe card at rest. */
export const SwipeCardIdle: Story = {
  render: () => (
    <SwipeableReviewCard
      swipe={idleSwipe}
      disabled={false}
    >
      Swipe right to approve, left to reject.
    </SwipeableReviewCard>
  ),
};

/** Mid-swipe to the right — the approve reveal layer shows and the card translates. */
export const SwipeCardApproving: Story = {
  render: () => (
    <SwipeableReviewCard
      swipe={{
        ...idleSwipe,
        displacement: 96,
      }}
      disabled={false}
    >
      Swipe right to approve, left to reject.
    </SwipeableReviewCard>
  ),
};
