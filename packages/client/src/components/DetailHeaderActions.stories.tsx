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

/** Both the Edit and Delete actions wired. */
export const EditAndDelete: Story = {};

/** Only the Edit action — no Delete handler. */
export const EditOnly: Story = {
  args: {
    onDelete: undefined,
  },
};

/** Only the Delete action — no Edit handler. */
export const DeleteOnly: Story = {
  args: {
    onEdit: undefined,
  },
};
