import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddPropertyGroupModal } from "./AddPropertyGroupModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddPropertyGroupModal",
  component: AddPropertyGroupModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddPropertyGroupModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The name-only inline-create dialog, opened. */
export const Default: Story = {};
