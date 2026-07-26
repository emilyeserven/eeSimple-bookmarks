import type { Meta, StoryObj } from "@storybook/react-vite";

import { FavoriteStar } from "./FavoriteStar";

const meta = {
  title: "Components/FavoriteStar",
  component: FavoriteStar,
} satisfies Meta<typeof FavoriteStar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The default filled amber star marking a favorited row. */
export const Default: Story = {};

/** A larger star via a className override. */
export const Large: Story = {
  args: {
    className: "size-6",
  },
};
