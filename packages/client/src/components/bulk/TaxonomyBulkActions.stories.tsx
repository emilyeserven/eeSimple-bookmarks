import type { BulkDeleteResult } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { UseMutationResult } from "@tanstack/react-query";

import { TaxonomyBulkActions } from "./TaxonomyBulkActions";

const bulkDelete = {
  mutate: () => {},
  isPending: false,
} as unknown as UseMutationResult<BulkDeleteResult[], Error, string[]>;

const meta = {
  title: "Components/TaxonomyBulkActions",
  component: TaxonomyBulkActions,
  args: {
    ids: ["a", "b", "c"],
    bulkDelete,
    noun: ["website", "websites"],
    onDone: () => {},
  },
} satisfies Meta<typeof TaxonomyBulkActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Delete trigger for a taxonomy listing — opens a confirm dialog. */
export const Default: Story = {};

/** A single item selected (singular noun in the confirm copy). */
export const SingleSelected: Story = {
  args: {
    ids: ["a"],
  },
};
