import type { Meta, StoryObj } from "@storybook/react-vite";

import { SourceDefaultCheckbox } from "./BookmarkSourceDefaultCheckbox";

const meta = {
  title: "Components/SourceDefaultCheckbox",
  component: SourceDefaultCheckbox,
  args: {
    checked: false,
    onCheckedChange: () => {},
    children: "Set as default for this source",
  },
} satisfies Meta<typeof SourceDefaultCheckbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Unchecked state — the default when no value is persisted. */
export const Unchecked: Story = {};

/** Checked state — the source is already set as the default. */
export const Checked: Story = {
  args: {
    checked: true,
  },
};

/** Longer label text variant used by the category field. */
export const CategoryLabel: Story = {
  args: {
    children: "Set as default category for this website",
  },
};
