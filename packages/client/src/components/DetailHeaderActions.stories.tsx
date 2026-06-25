import type { Meta, StoryObj } from "@storybook/react-vite";

import { DetailHeaderActions } from "./DetailHeaderActions";

const meta = {
  title: "Components/DetailHeaderActions",
  component: DetailHeaderActions,
  args: {
    onEdit: () => {},
    onDelete: () => {},
  },
} satisfies Meta<typeof DetailHeaderActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EditAndDelete: Story = {};

export const EditOnly: Story = {
  args: {
    onDelete: undefined,
  },
};

export const DeleteOnly: Story = {
  args: {
    onEdit: undefined,
  },
};
