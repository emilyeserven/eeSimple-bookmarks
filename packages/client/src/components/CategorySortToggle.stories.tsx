import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategorySortToggle } from "./CategorySortToggle";

const meta = {
  title: "Components/CategorySortToggle",
  component: CategorySortToggle,
} satisfies Meta<typeof CategorySortToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Categories listing sort-mode dropdown (reads/writes the uiStore pref). */
export const Default: Story = {};
