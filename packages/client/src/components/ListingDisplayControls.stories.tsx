import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListingDisplayControls } from "./ListingDisplayControls";

const meta = {
  title: "Components/ListingDisplayControls",
  component: ListingDisplayControls,
  args: {
    pageKey: "category:default",
  },
} satisfies Meta<typeof ListingDisplayControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The card/table view toggle plus (in cards mode) the grid column-count select. */
export const Default: Story = {};
