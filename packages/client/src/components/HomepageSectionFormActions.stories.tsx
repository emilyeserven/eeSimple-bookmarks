import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomepageSectionFormActions } from "./HomepageSectionFormActions";

const meta = {
  title: "Components/HomepageSectionFormActions",
  component: HomepageSectionFormActions,
  args: {
    isAutoSave: false,
    canSave: true,
    onCancel: () => {},
  },
} satisfies Meta<typeof HomepageSectionFormActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Create mode: Save + Cancel buttons. */
export const Create: Story = {};

/** Create mode with an empty title — Save disabled. */
export const SaveDisabled: Story = {
  args: {
    canSave: false,
  },
};

/** Create mode mid-save. */
export const Saving: Story = {
  args: {
    isPending: true,
  },
};

/** Auto-save (edit) mode: a single Done button. */
export const AutoSave: Story = {
  args: {
    isAutoSave: true,
  },
};

/** Edit mode with a Delete button. */
export const WithDelete: Story = {
  args: {
    isAutoSave: true,
    onDelete: () => {},
  },
};
