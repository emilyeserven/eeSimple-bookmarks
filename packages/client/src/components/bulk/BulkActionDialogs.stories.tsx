import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BulkComboboxDialog,
  BulkConfirmDeleteDialog,
  BulkTagsDialog,
} from "./BulkActionDialogs";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/BulkActionDialogs",
  component: BulkComboboxDialog,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    ids: ["a", "b", "c"],
    onDone: () => {},
    triggerLabel: "Set category",
    title: "Set category",
    placeholder: "Select a category",
    noun: "bookmark",
    isPending: false,
    options: [
      {
        value: "cat-articles",
        label: "Articles",
      },
      {
        value: "cat-videos",
        label: "Videos",
      },
    ],
    onApply: () => {},
  },
} satisfies Meta<typeof BulkComboboxDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The pick-one-and-apply dialog trigger (opens a combobox dialog). */
export const ComboboxDialog: Story = {};

/** The add/remove-tags dialog trigger. */
export const TagsDialog: StoryObj<typeof BulkTagsDialog> = {
  render: () => (
    <BulkTagsDialog
      ids={["a", "b", "c"]}
      onDone={() => {}}
      noun="bookmark"
      title="Add or remove tags"
      isPending={false}
      onApply={() => {}}
    />
  ),
};

/** The confirm-then-delete dialog trigger. */
export const ConfirmDeleteDialog: StoryObj<typeof BulkConfirmDeleteDialog> = {
  render: () => (
    <BulkConfirmDeleteDialog
      ids={["a", "b", "c"]}
      onDone={() => {}}
      noun="bookmark"
      isPending={false}
      onDelete={() => {}}
    />
  ),
};
