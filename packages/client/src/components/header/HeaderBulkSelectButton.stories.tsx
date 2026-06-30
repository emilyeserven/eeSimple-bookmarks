import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeaderBulkSelectButton } from "./HeaderBulkSelectButton";

const meta = {
  title: "Components/Header/HeaderBulkSelectButton",
  component: HeaderBulkSelectButton,
  args: {
    pageKey: "story-listing",
  },
} satisfies Meta<typeof HeaderBulkSelectButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The bulk-selection toggle for a listing page; click flips selection mode in the UI store. */
export const Default: Story = {};
