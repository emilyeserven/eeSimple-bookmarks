import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryPill } from "./CategoryPill";

const meta = {
  title: "Components/CategoryPill",
  component: CategoryPill,
  args: {
    category: {
      id: "cat-content",
      name: "Content",
      slug: "content",
      icon: "BookOpen",
    },
  },
} satisfies Meta<typeof CategoryPill>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoIcon: Story = {
  args: {
    category: {
      id: "cat-default",
      name: "Default",
      slug: "default",
      icon: null,
    },
  },
};
