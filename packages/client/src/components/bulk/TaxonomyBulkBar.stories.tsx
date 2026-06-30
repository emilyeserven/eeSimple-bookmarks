import type { ListSelection } from "../../lib/useListSelection";
import type { BulkDeleteResult } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { UseMutationResult } from "@tanstack/react-query";

import { TaxonomyBulkBar } from "./TaxonomyBulkBar";

const bulkDelete = {
  mutate: () => {},
  isPending: false,
} as unknown as UseMutationResult<BulkDeleteResult[], Error, string[]>;

const selection: ListSelection = {
  selectedIds: ["a", "b", "c"],
  selectedSet: new Set(["a", "b", "c"]),
  isSelected: id => ["a", "b", "c"].includes(id),
  toggle: () => {},
  selectAll: () => {},
  clear: () => {},
  count: 3,
  allSelected: false,
  mode: true,
  setMode: () => {},
};

const meta = {
  title: "Components/TaxonomyBulkBar",
  component: TaxonomyBulkBar,
  args: {
    selection,
    totalSelectable: 12,
    bulkDelete,
    noun: ["website", "websites"],
  },
} satisfies Meta<typeof TaxonomyBulkBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A partial selection — the bar offers a "Select all" shortcut and a Delete action. */
export const Default: Story = {};

/** Everything selected — the "Select all" shortcut is hidden. */
export const AllSelected: Story = {
  args: {
    selection: {
      ...selection,
      count: 12,
      selectedIds: Array.from({
        length: 12,
      }, (_, i) => `id-${i}`),
      allSelected: true,
    },
  },
};

/** Nothing selected — the bar renders nothing. */
export const Empty: Story = {
  args: {
    selection: {
      ...selection,
      selectedIds: [],
      selectedSet: new Set<string>(),
      count: 0,
    },
  },
};
