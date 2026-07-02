import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkPagination } from "./BookmarkPagination";

const meta = {
  title: "Components/BookmarkPagination",
  component: BookmarkPagination,
  args: {
    page: 1,
    totalPages: 3,
    rangeStart: 1,
    rangeEnd: 24,
    total: 60,
    onPageChange: () => {},
  },
} satisfies Meta<typeof BookmarkPagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Deep in a long result set — the page list collapses distant pages to ellipses. */
export const ManyPages: Story = {
  args: {
    page: 12,
    totalPages: 40,
    rangeStart: 265,
    rangeEnd: 288,
    total: 951,
  },
};
