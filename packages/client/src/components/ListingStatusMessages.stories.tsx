import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListingStatusMessages } from "./ListingStatusMessages";

const meta = {
  title: "Components/ListingStatusMessages",
  component: ListingStatusMessages,
  args: {
    isLoading: false,
    error: null,
    totalCount: 12,
    filteredCount: 12,
    rawQuery: "",
    hasQuery: false,
    loadingLabel: "Loading websites…",
    entityPlural: "websites",
    emptyMessage: (
      <p className="text-muted-foreground">
        No websites yet. They&apos;re created automatically when you add bookmarks.
      </p>
    ),
  },
} satisfies Meta<typeof ListingStatusMessages>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Items present, no active query — the row renders nothing. */
export const Idle: Story = {};

/** The loading label while the listing fetches. */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

/** A load error message. */
export const ErrorState: Story = {
  args: {
    error: new Error("Failed to load websites."),
  },
};

/** No items at all, showing the empty message. */
export const Empty: Story = {
  args: {
    totalCount: 0,
    filteredCount: 0,
  },
};

/** An active query matching a subset — shows the filtered/total count. */
export const FilteredSubset: Story = {
  args: {
    totalCount: 12,
    filteredCount: 3,
    rawQuery: "news",
    hasQuery: true,
  },
};

/** An active query matching nothing, showing the no-match message. */
export const NoMatch: Story = {
  args: {
    totalCount: 12,
    filteredCount: 0,
    rawQuery: "zzz",
    hasQuery: true,
  },
};
