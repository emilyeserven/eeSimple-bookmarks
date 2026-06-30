import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddCategoryModal } from "./AddCategoryModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddCategoryModal",
  component: AddCategoryModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddCategoryModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The name-only inline-create dialog, opened. */
export const Default: Story = {};
